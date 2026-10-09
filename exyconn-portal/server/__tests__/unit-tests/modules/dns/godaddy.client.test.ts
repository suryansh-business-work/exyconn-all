import { randomUUID } from 'node:crypto';
import { godaddyClient } from '../../../../src/modules/dns/godaddy.client';
import { GodaddyConfigModel } from '../../../../src/modules/dns/godaddy-config.model';
import { ConfigurationError } from '../../../../src/utils/errors';
import ips from '../../../fixtures/ips.json';

/** Never a literal credential: each run makes its own. */
const key = { apiKey: `key-${randomUUID()}`, apiSecret: `secret-${randomUUID()}` };

const reply = (status: number, body: string) => Promise.resolve(new Response(body, { status }));
const json = (value: unknown) => reply(200, JSON.stringify(value));

let fetchMock: jest.SpiedFunction<typeof fetch>;

const call = (index = 0) => {
  const [url, init] = fetchMock.mock.calls[index];
  return { url: String(url), init: init ?? {} };
};

beforeEach(async () => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
  await GodaddyConfigModel.create({ label: 'Main', ...key, isActive: true });
});

afterEach(() => jest.restoreAllMocks());

describe('godaddyClient.verify', () => {
  it('signs the call with the key and secret it is given', async () => {
    fetchMock.mockImplementation(() => json([]));
    await godaddyClient.verify(key);

    const { url, init } = call();
    expect(url).toBe('https://api.godaddy.com/v1/domains?limit=1');
    expect(init.headers).toMatchObject({
      Authorization: `sso-key ${key.apiKey}:${key.apiSecret}`,
      Accept: 'application/json',
    });
  });

  it('explains a rejected key', async () => {
    fetchMock.mockImplementation(() => reply(401, 'nope'));
    await expect(godaddyClient.verify(key)).rejects.toThrow(/rejected the API key or secret/);
  });

  it('explains that the Domains API is limited to eligible accounts', async () => {
    fetchMock.mockImplementation(() => reply(403, 'ACCESS_DENIED'));
    await expect(godaddyClient.verify(key)).rejects.toThrow(
      /refused access to its Domains API for this account \(ACCESS_DENIED\)/,
    );
  });

  it('reports any other failure with its status and body', async () => {
    fetchMock.mockImplementation(() => reply(500, 'boom'));
    await expect(godaddyClient.verify(key)).rejects.toThrow('GoDaddy request failed (500): boom');
  });
});

describe('with the active configuration', () => {
  it('refuses when no configuration is active', async () => {
    await GodaddyConfigModel.updateMany({}, { isActive: false });
    await expect(godaddyClient.listDomains()).rejects.toBeInstanceOf(ConfigurationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lists the account’s domains in lower case', async () => {
    fetchMock.mockImplementation(() =>
      json([
        { domain: 'Exyconn.COM', status: 'ACTIVE', nameServers: ['NS1.DomainControl.com'] },
        { domain: 'other.io', status: 'EXPIRED', nameServers: null },
      ]),
    );

    await expect(godaddyClient.listDomains()).resolves.toEqual([
      { domain: 'exyconn.com', status: 'ACTIVE', nameServers: ['ns1.domaincontrol.com'] },
      { domain: 'other.io', status: 'EXPIRED', nameServers: [] },
    ]);
    expect(call().url).toBe('https://api.godaddy.com/v1/domains?limit=1000');
    expect(call().init.headers).toMatchObject({
      Authorization: `sso-key ${key.apiKey}:${key.apiSecret}`,
    });
  });

  it('reads a domain’s nameservers, or none', async () => {
    fetchMock.mockImplementationOnce(() => json({ nameServers: ['A.NS.net'] }));
    await expect(godaddyClient.getNameServers('ex ample.com')).resolves.toEqual(['a.ns.net']);
    expect(call().url).toBe('https://api.godaddy.com/v1/domains/ex%20ample.com');

    fetchMock.mockImplementationOnce(() => json({}));
    await expect(godaddyClient.getNameServers('exyconn.com')).resolves.toEqual([]);
  });

  it('lists a domain’s records as GoDaddy returns them', async () => {
    const rows = [{ type: 'A', name: '@', data: ips.ip1_2_3_4, ttl: 600 }];
    fetchMock.mockImplementation(() => json(rows));
    await expect(godaddyClient.listRecords('exyconn.com')).resolves.toEqual(rows);
    expect(call().url).toBe('https://api.godaddy.com/v1/domains/exyconn.com/records');
  });

  it('reads one host’s A records, and an empty body as none', async () => {
    fetchMock.mockImplementationOnce(() =>
      json([{ data: ips.ip1_2_3_4, ttl: 600, name: '@', type: 'A' }]),
    );
    await expect(godaddyClient.aRecords('exyconn.com', '@')).resolves.toEqual([
      { data: ips.ip1_2_3_4, ttl: 600 },
    ]);
    expect(call().url).toBe('https://api.godaddy.com/v1/domains/exyconn.com/records/A/%40');

    fetchMock.mockImplementationOnce(() => reply(200, ''));
    await expect(godaddyClient.aRecords('exyconn.com', 'www')).resolves.toEqual([]);
  });

  it('replaces a host’s A records with a PUT', async () => {
    fetchMock.mockImplementation(() => reply(200, ''));
    const records = [{ data: ips.ip5_6_7_8, ttl: 600 }];
    await godaddyClient.setARecords('exyconn.com', 'www', records);

    const { url, init } = call();
    expect(url).toBe('https://api.godaddy.com/v1/domains/exyconn.com/records/A/www');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(String(init.body))).toEqual(records);
  });

  it('points the domain at new nameservers with a PATCH', async () => {
    fetchMock.mockImplementation(() => reply(200, ''));
    await godaddyClient.setNameServers('exyconn.com', ['a.ns.net', 'b.ns.net']);

    const { url, init } = call();
    expect(url).toBe('https://api.godaddy.com/v1/domains/exyconn.com');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({ nameServers: ['a.ns.net', 'b.ns.net'] });
  });
});
