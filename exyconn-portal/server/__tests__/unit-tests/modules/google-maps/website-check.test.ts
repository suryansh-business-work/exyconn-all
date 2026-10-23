import { lookup } from 'node:dns/promises';
import {
  checkWebsite,
  checkWebsites,
  faviconUrl,
} from '../../../../src/modules/google-maps/website-check';
import ips from '../../../fixtures/ips.json';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

const lookupMock = lookup as unknown as jest.Mock;
let fetchMock: jest.SpyInstance;

const SITE = 'https://www.smile.example/home';
const LOGO = faviconUrl('smile.example');
const png = () => new Response('icon', { status: 200, headers: { 'content-type': 'image/png' } });

/** Answers each request by its method and address, in the order listed per key. */
function answer(responses: Record<string, Array<Response | Error>>) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const key = url.startsWith(LOGO) ? 'FAVICON' : (init.method ?? 'GET');
    const next = responses[key]?.shift();
    if (!next) {
      throw new Error(`No answer for ${key} ${url}`);
    }
    if (next instanceof Error) {
      throw next;
    }
    return next;
  });
}

const methods = () =>
  fetchMock.mock.calls.map(([url, init]) => `${(init as RequestInit).method ?? 'GET'} ${url}`);

beforeEach(() => {
  lookupMock.mockResolvedValue([{ address: ips.ip93_184_216_34, family: 4 }]);
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  fetchMock.mockRestore();
});

describe('checkWebsite', () => {
  it('keeps a site whose HEAD answers 200, with the favicon Google has for it', async () => {
    answer({ HEAD: [new Response(null, { status: 200 })], FAVICON: [png()] });

    await expect(checkWebsite(SITE)).resolves.toEqual({ ok: true, reason: '', logoUrl: LOGO });
    expect(methods()).toEqual([`HEAD ${SITE}`, `GET ${LOGO}`]);
    expect(LOGO).toBe('https://www.google.com/s2/favicons?domain=smile.example&sz=64');
  });

  it('asks with GET when HEAD is refused, and follows redirects to the final answer', async () => {
    answer({
      HEAD: [new Response(null, { status: 405 })],
      GET: [
        new Response(null, { status: 301, headers: { location: 'https://smile.example/' } }),
        new Response('<html></html>', { status: 200 }),
      ],
      FAVICON: [png()],
    });

    await expect(checkWebsite(SITE)).resolves.toMatchObject({ ok: true, logoUrl: LOGO });
    expect(methods()).toEqual([
      `HEAD ${SITE}`,
      `GET ${SITE}`,
      'GET https://smile.example/',
      `GET ${LOGO}`,
    ]);
  });

  it.each([404, 500])('drops a site that answers %i', async (status) => {
    answer({
      HEAD: [new Response(null, { status })],
      GET: [new Response('gone', { status })],
    });

    await expect(checkWebsite(SITE)).resolves.toEqual({
      ok: false,
      reason: `Answered ${status} instead of 200 OK`,
      logoUrl: '',
    });
  });

  it('drops a site that does not answer in time, without asking again', async () => {
    const timeout = Object.assign(new Error('The operation was aborted due to timeout'), {
      name: 'TimeoutError',
    });
    answer({ HEAD: [timeout] });

    await expect(checkWebsite(SITE)).resolves.toEqual({
      ok: false,
      reason: 'No answer within 5 seconds',
      logoUrl: '',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('drops a site that cannot be reached at all', async () => {
    answer({ HEAD: [new TypeError('fetch failed')] });

    await expect(checkWebsite(SITE)).resolves.toMatchObject({
      ok: false,
      reason: 'The website could not be reached',
    });
  });

  it('drops a site whose name does not resolve', async () => {
    lookupMock.mockRejectedValue(Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' }));

    await expect(checkWebsite(SITE)).resolves.toEqual({
      ok: false,
      reason: 'The host www.smile.example could not be resolved',
      logoUrl: '',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([ips.ip10_0_0_1, ips.ip169_254_169_254, '127.0.0.1'])(
    'refuses a site on the private address %s without requesting it',
    async (address) => {
      lookupMock.mockResolvedValue([{ address, family: 4 }]);

      await expect(checkWebsite(SITE)).resolves.toEqual({
        ok: false,
        reason: 'The host www.smile.example is not a public internet address',
        logoUrl: '',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('refuses an address that is not http or https', async () => {
    await expect(checkWebsite('ftp://smile.example')).resolves.toMatchObject({
      ok: false,
      reason: 'Use an http or https URL',
    });
  });

  it('keeps the site but no logo when Google has no icon for it (its 404 globe)', async () => {
    answer({
      HEAD: [new Response(null, { status: 200 })],
      FAVICON: [new Response('globe', { status: 404, headers: { 'content-type': 'image/png' } })],
    });

    await expect(checkWebsite(SITE)).resolves.toEqual({ ok: true, reason: '', logoUrl: '' });
  });

  it('keeps no logo when the favicon is not an image or does not arrive', async () => {
    answer({
      HEAD: [new Response(null, { status: 204 }), new Response(null, { status: 200 })],
      FAVICON: [
        new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } }),
        new TypeError('fetch failed'),
      ],
    });

    await expect(checkWebsite(SITE)).resolves.toEqual({ ok: true, reason: '', logoUrl: '' });
    await expect(checkWebsite(SITE)).resolves.toEqual({ ok: true, reason: '', logoUrl: '' });
  });
});

describe('checkWebsites', () => {
  it('visits each distinct website once and skips blanks', async () => {
    answer({
      HEAD: [new Response(null, { status: 200 }), new Response(null, { status: 404 })],
      GET: [new Response('missing', { status: 404 })],
      FAVICON: [new Response('no', { status: 404, headers: { 'content-type': 'image/png' } })],
    });

    const checks = await checkWebsites([SITE, '', SITE, 'https://dead.example']);

    expect([...checks.keys()]).toEqual([SITE, 'https://dead.example']);
    expect(checks.get(SITE)?.ok).toBe(true);
    expect(checks.get('https://dead.example')?.ok).toBe(false);
  });
});
