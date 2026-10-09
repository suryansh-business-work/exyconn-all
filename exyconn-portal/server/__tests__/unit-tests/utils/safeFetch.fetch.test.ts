import { lookup } from 'node:dns/promises';
import { UnsafeUrlError, safeFetch } from '../../../src/utils/safeFetch';
import ips from '../../fixtures/ips.json';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

const lookupMock = lookup as unknown as jest.Mock;
let fetchMock: jest.SpyInstance;

const redirect = (status: number, location?: string) =>
  new Response(null, { status, headers: location ? { location } : {} });

/** The URL and init of the nth request made. */
function hop(index: number): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit];
  return { url, init };
}

beforeEach(() => {
  lookupMock.mockResolvedValue([{ address: ips.ip93_184_216_34, family: 4 }]);
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  fetchMock.mockRestore();
});

describe('safeFetch', () => {
  it('returns the answer with its body already read, without following redirects itself', async () => {
    fetchMock.mockResolvedValue(
      new Response('pong', { status: 200, statusText: 'OK', headers: { 'x-test': '1' } }),
    );
    const response = await safeFetch('https://example.com/ping', { method: 'POST', body: 'ping' });
    expect(response.status).toBe(200);
    expect(response.statusText).toBe('OK');
    expect(response.headers.get('x-test')).toBe('1');
    await expect(response.text()).resolves.toBe('pong');
    const { url, init } = hop(0);
    expect(url).toBe('https://example.com/ping');
    expect(init).toMatchObject({ method: 'POST', body: 'ping', redirect: 'manual' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('refuses http unless the caller allows it, and then names both schemes', async () => {
    await expect(safeFetch('http://example.com')).rejects.toThrow('Use an https URL');
    fetchMock.mockResolvedValue(new Response('ok'));
    await expect(safeFetch('http://example.com', {}, { allowHttp: true })).resolves.toBeInstanceOf(
      Response,
    );
    await expect(safeFetch('ftp://example.com', {}, { allowHttp: true })).rejects.toThrow(
      'Use an http or https URL',
    );
  });

  it('refuses a private destination before connecting', async () => {
    lookupMock.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    await expect(safeFetch('https://localhost.test')).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('follows a relative redirect, checking the next host again', async () => {
    const moved = new Response('see /moved', { status: 302, headers: { location: '/moved' } });
    fetchMock.mockResolvedValueOnce(moved).mockResolvedValueOnce(new Response('there'));
    const response = await safeFetch('https://example.com/start');
    await expect(response.text()).resolves.toBe('there');
    expect(hop(1).url).toBe('https://example.com/moved');
    expect(hop(1).init.method).toBeUndefined();
    expect(lookupMock).toHaveBeenCalledTimes(2);
    expect(moved.bodyUsed).toBe(true);
  });

  it('refuses a redirect that points at a private address', async () => {
    fetchMock.mockResolvedValueOnce(redirect(301, 'https://internal.test/admin'));
    lookupMock
      .mockResolvedValueOnce([{ address: ips.ip93_184_216_34, family: 4 }])
      .mockResolvedValueOnce([{ address: ips.ip169_254_169_254, family: 4 }]);
    await expect(safeFetch('https://example.com')).rejects.toThrow(
      'The host internal.test is not a public internet address',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([303, 301, 302])('turns a POST into a bodiless GET after a %i', async (status) => {
    fetchMock
      .mockResolvedValueOnce(redirect(status, '/next'))
      .mockResolvedValueOnce(new Response(''));
    await safeFetch('https://example.com', { method: 'post', body: 'data' });
    expect(hop(1).init.method).toBe('GET');
    expect(hop(1).init.body).toBeUndefined();
  });

  it('turns any request into a GET after a 303', async () => {
    fetchMock.mockResolvedValueOnce(redirect(303, '/next')).mockResolvedValueOnce(new Response(''));
    await safeFetch('https://example.com', { method: 'PUT', body: 'data' });
    expect(hop(1).init.method).toBe('GET');
  });

  it.each([307, 308])('keeps the method and body through a %i', async (status) => {
    fetchMock
      .mockResolvedValueOnce(redirect(status, '/next'))
      .mockResolvedValueOnce(new Response(''));
    await safeFetch('https://example.com', { method: 'POST', body: 'data' });
    expect(hop(1).init).toMatchObject({ method: 'POST', body: 'data' });
  });

  it('keeps a PUT through a 301', async () => {
    fetchMock.mockResolvedValueOnce(redirect(301, '/next')).mockResolvedValueOnce(new Response(''));
    await safeFetch('https://example.com', { method: 'PUT', body: 'data' });
    expect(hop(1).init).toMatchObject({ method: 'PUT', body: 'data' });
  });

  it('gives up after too many redirects', async () => {
    fetchMock.mockImplementation(async () => redirect(302, '/again'));
    await expect(safeFetch('https://example.com', {}, { maxRedirects: 2 })).rejects.toThrow(
      'More than 2 redirects',
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('follows three redirects by default', async () => {
    fetchMock.mockImplementation(async () => redirect(302, '/again'));
    await expect(safeFetch('https://example.com')).rejects.toThrow('More than 3 redirects');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('returns a redirect status that carries no location as it is', async () => {
    fetchMock.mockResolvedValue(redirect(302));
    const response = await safeFetch('https://example.com');
    expect(response.status).toBe(302);
    await expect(response.text()).resolves.toBe('');
  });

  it('answers a null body for a no-content status', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const response = await safeFetch('https://example.com');
    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  it('refuses a body larger than the cap and stops reading it', async () => {
    fetchMock.mockResolvedValue(new Response('x'.repeat(20)));
    await expect(safeFetch('https://example.com', {}, { maxBytes: 10 })).rejects.toThrow(
      'The response was larger than 10 bytes',
    );
  });

  it('reads a body made of several chunks up to the cap', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('ab'));
        controller.enqueue(encoder.encode('cd'));
        controller.close();
      },
    });
    fetchMock.mockResolvedValue(new Response(stream));
    const response = await safeFetch('https://example.com', {}, { maxBytes: 4, timeoutMs: 500 });
    await expect(response.text()).resolves.toBe('abcd');
  });
});
