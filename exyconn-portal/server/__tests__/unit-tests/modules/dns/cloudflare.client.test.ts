import { randomUUID } from 'node:crypto';
import { cloudflareClient } from '../../../../src/modules/dns/cloudflare.client';
import { CloudflareConfigModel } from '../../../../src/modules/dns/cloudflare-config.model';
import { ConfigurationError } from '../../../../src/utils/errors';

const API = 'https://api.cloudflare.com/client/v4';
/** Never a literal credential: each run makes its own. */
const key = { apiToken: `token-${randomUUID()}`, accountId: 'acc-1' };

const reply = (status: number, body: unknown) =>
  Promise.resolve(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));
const ok = (result: unknown, extra: object = {}) => reply(200, { success: true, result, ...extra });

let fetchMock: jest.SpiedFunction<typeof fetch>;

const call = (index = 0) => {
  const [url, init] = fetchMock.mock.calls[index];
  return { url: String(url), init: init ?? {} };
};

beforeEach(async () => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
  await CloudflareConfigModel.create({ label: 'Main', ...key, isActive: true });
});

afterEach(() => jest.restoreAllMocks());

describe('cloudflareClient requests', () => {
  it('verifies a token with a bearer header', async () => {
    fetchMock.mockImplementation(() => ok({ status: 'active' }));
    await cloudflareClient.verify(key);

    expect(call().url).toBe(`${API}/user/tokens/verify`);
    expect(call().init.headers).toMatchObject({ Authorization: `Bearer ${key.apiToken}` });
  });

  it('names every error Cloudflare gives', async () => {
    fetchMock.mockImplementation(() =>
      reply(403, {
        success: false,
        errors: [
          { code: 1, message: 'Invalid token' },
          { code: 2, message: 'Expired' },
        ],
        result: null,
      }),
    );
    await expect(cloudflareClient.verify(key)).rejects.toThrow(
      'Cloudflare request failed (403): Invalid token; Expired',
    );
  });

  it('says there is no detail when the body is not JSON', async () => {
    fetchMock.mockImplementation(() => reply(502, '<html>Bad gateway</html>'));
    await expect(cloudflareClient.verify(key)).rejects.toThrow(
      'Cloudflare request failed (502): no detail',
    );
  });

  it('refuses a 200 whose envelope says it failed', async () => {
    fetchMock.mockImplementation(() => reply(200, { success: false, result: null }));
    await expect(cloudflareClient.verify(key)).rejects.toThrow('(200): no detail');
  });
});

describe('with the active configuration', () => {
  it('refuses when no configuration is active', async () => {
    await CloudflareConfigModel.updateMany({}, { isActive: false });
    await expect(cloudflareClient.findZone('exyconn.com')).rejects.toBeInstanceOf(
      ConfigurationError,
    );
  });

  it('finds a zone, lower-casing its nameservers, or reports none', async () => {
    fetchMock.mockImplementationOnce(() =>
      ok([
        {
          id: 'z1',
          status: 'pending',
          name_servers: ['Ada.NS.Cloudflare.com'],
          original_name_servers: null,
        },
      ]),
    );
    await expect(cloudflareClient.findZone('exyconn.com')).resolves.toEqual({
      id: 'z1',
      status: 'pending',
      nameServers: ['ada.ns.cloudflare.com'],
      originalNameServers: [],
    });
    expect(call().url).toBe(`${API}/zones?name=exyconn.com`);

    fetchMock.mockImplementationOnce(() => ok([]));
    await expect(cloudflareClient.findZone('exyconn.com')).resolves.toBeNull();
  });

  it('creates a full zone in the configured account', async () => {
    fetchMock.mockImplementation(() =>
      ok({ id: 'z2', status: 'pending', original_name_servers: ['NS1.DomainControl.com'] }),
    );
    await expect(cloudflareClient.createZone('exyconn.com')).resolves.toEqual({
      id: 'z2',
      status: 'pending',
      nameServers: [],
      originalNameServers: ['ns1.domaincontrol.com'],
    });
    const { url, init } = call();
    expect(url).toBe(`${API}/zones`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      name: 'exyconn.com',
      account: { id: 'acc-1' },
      type: 'full',
      jump_start: false,
    });
  });

  it('reads every page of a zone’s records', async () => {
    const first = { id: 'r1', type: 'A', name: 'a', content: '1.1.1.1', ttl: 1 };
    const second = { id: 'r2', type: 'A', name: 'b', content: '2.2.2.2', ttl: 1 };
    fetchMock
      .mockImplementationOnce(() => ok([first], { result_info: { page: 1, total_pages: 2 } }))
      .mockImplementationOnce(() => ok([second], { result_info: { page: 2, total_pages: 2 } }));

    await expect(cloudflareClient.listRecords('z1')).resolves.toEqual([first, second]);
    expect(call(0).url).toBe(`${API}/zones/z1/dns_records?per_page=1000&page=1`);
    expect(call(1).url).toBe(`${API}/zones/z1/dns_records?per_page=1000&page=2`);
  });

  it('treats a listing without page info as one page', async () => {
    fetchMock.mockImplementation(() => ok([]));
    await expect(cloudflareClient.listRecords('z1')).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reads one host’s A records', async () => {
    const rows = [{ id: 'r1', type: 'A', name: 'www.exyconn.com', content: '1.1.1.1', ttl: 1 }];
    fetchMock.mockImplementation(() => ok(rows));
    await expect(cloudflareClient.aRecords('z1', 'www.exyconn.com')).resolves.toEqual(rows);
    expect(call().url).toBe(`${API}/zones/z1/dns_records?type=A&name=www.exyconn.com`);
  });

  it('updates, deletes and creates records with the right verbs', async () => {
    fetchMock.mockImplementation(() => ok({}));
    await cloudflareClient.updateRecord('z1', 'r1', { content: '1.1.1.1' });
    await cloudflareClient.deleteRecord('z1', 'r2');
    await cloudflareClient.createRecord('z1', { type: 'A' });

    expect([call(0).url, call(0).init.method]).toEqual([`${API}/zones/z1/dns_records/r1`, 'PUT']);
    expect(JSON.parse(String(call(0).init.body))).toEqual({ content: '1.1.1.1' });
    expect([call(1).url, call(1).init.method]).toEqual([
      `${API}/zones/z1/dns_records/r2`,
      'DELETE',
    ]);
    expect([call(2).url, call(2).init.method]).toEqual([`${API}/zones/z1/dns_records`, 'POST']);
    expect(JSON.parse(String(call(2).init.body))).toEqual({ type: 'A' });
  });
});
