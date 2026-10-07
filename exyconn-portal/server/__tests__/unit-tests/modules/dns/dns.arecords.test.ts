import {
  MIN_A_TTL,
  hostInZone,
  readARecords,
  setARecord,
} from '../../../../src/modules/dns/dns.arecords';
import {
  cloudflareClient,
  type CloudflareZone,
} from '../../../../src/modules/dns/cloudflare.client';
import { godaddyClient } from '../../../../src/modules/dns/godaddy.client';
import { CLOUDFLARE_NS, GODADDY_NS, cloudflareA, zone } from './dns.fixtures';

const IP = '203.0.113.10';
const none = () => Promise.resolve(null);

/** `findZone` is a factory so a refusal is only created when the code under test asks. */
function stub(nameServers: string[], findZone: () => Promise<CloudflareZone | null>) {
  jest.spyOn(godaddyClient, 'listDomains').mockResolvedValue([
    { domain: 'exyconn.com', status: 'ACTIVE', nameServers },
    { domain: 'eu.exyconn.com', status: 'ACTIVE', nameServers },
    { domain: 'other.com', status: 'ACTIVE', nameServers },
  ]);
  jest.spyOn(godaddyClient, 'getNameServers').mockResolvedValue(nameServers);
  jest.spyOn(cloudflareClient, 'findZone').mockImplementation(findZone);
  return {
    godaddyRead: jest.spyOn(godaddyClient, 'aRecords').mockResolvedValue([{ data: IP, ttl: 600 }]),
    godaddyWrite: jest.spyOn(godaddyClient, 'setARecords').mockResolvedValue(undefined),
    cloudflareRead: jest.spyOn(cloudflareClient, 'aRecords'),
    update: jest.spyOn(cloudflareClient, 'updateRecord').mockResolvedValue(undefined),
    create: jest.spyOn(cloudflareClient, 'createRecord').mockResolvedValue(undefined),
    remove: jest.spyOn(cloudflareClient, 'deleteRecord').mockResolvedValue(undefined),
  };
}

afterEach(() => jest.restoreAllMocks());

describe('hostInZone', () => {
  it('splits a host under the longest registered domain it belongs to', async () => {
    stub(GODADDY_NS, none);
    await expect(hostInZone('exyconn.com')).resolves.toEqual({
      host: 'exyconn.com',
      zone: 'exyconn.com',
      name: '@',
    });
    await expect(hostInZone('blog.eu.exyconn.com')).resolves.toEqual({
      host: 'blog.eu.exyconn.com',
      zone: 'eu.exyconn.com',
      name: 'blog',
    });
  });

  it('refuses a host on no domain of the account', async () => {
    stub(GODADDY_NS, none);
    await expect(hostInZone('notexyconn.com')).rejects.toThrow(
      'notexyconn.com is not a domain on the GoDaddy account',
    );
  });
});

describe('readARecords', () => {
  it('reads GoDaddy’s records while GoDaddy answers, even if Cloudflare cannot be asked', async () => {
    const stubs = stub(GODADDY_NS, () => Promise.reject(new Error('no config')));
    await expect(readARecords('www.exyconn.com')).resolves.toEqual({
      host: 'www.exyconn.com',
      zone: 'exyconn.com',
      name: 'www',
      authority: 'GODADDY',
      records: [{ ip: IP, ttl: 600 }],
    });
    expect(stubs.godaddyRead).toHaveBeenCalledWith('exyconn.com', 'www');
  });

  it('reads Cloudflare’s records once Cloudflare answers', async () => {
    const stubs = stub(CLOUDFLARE_NS, () => Promise.resolve(zone()));
    stubs.cloudflareRead.mockResolvedValue([{ ...cloudflareA('198.51.100.1'), ttl: 300 }]);
    const read = await readARecords('exyconn.com');
    expect(read).toMatchObject({
      authority: 'CLOUDFLARE',
      records: [{ ip: '198.51.100.1', ttl: 300 }],
    });
    expect(stubs.cloudflareRead).toHaveBeenCalledWith('zone-1', 'exyconn.com');
  });

  it('reads nothing when another provider serves the zone', async () => {
    stub(['ns1.elsewhere.net', 'ns2.elsewhere.net'], none);
    await expect(readARecords('exyconn.com')).resolves.toMatchObject({
      authority: 'OTHER',
      records: [],
    });
  });
});

describe('setARecord', () => {
  it('refuses anything but an IPv4 address and a TTL in range', async () => {
    await expect(setARecord('exyconn.com', '::1', 600)).rejects.toThrow('Enter an IPv4 address');
    const ttl = 'Use a TTL between 600 and 86400 seconds.';
    await expect(setARecord('exyconn.com', IP, MIN_A_TTL - 1)).rejects.toThrow(ttl);
    await expect(setARecord('exyconn.com', IP, 86_401)).rejects.toThrow(ttl);
    await expect(setARecord('exyconn.com', IP, 600.5)).rejects.toThrow(ttl);
  });

  it('replaces the host’s A records at GoDaddy, then reads them back', async () => {
    const stubs = stub(GODADDY_NS, none);
    const result = await setARecord('www.exyconn.com', IP, 900);
    expect(stubs.godaddyWrite).toHaveBeenCalledWith('exyconn.com', 'www', [{ data: IP, ttl: 900 }]);
    expect(result.records).toEqual([{ ip: IP, ttl: 600 }]);
  });

  it('updates the first Cloudflare record, keeps its proxy flag and removes the rest', async () => {
    const stubs = stub(CLOUDFLARE_NS, () => Promise.resolve(zone()));
    stubs.cloudflareRead.mockResolvedValue([
      { ...cloudflareA('1.1.1.1', 'keep'), proxied: true },
      cloudflareA('2.2.2.2', 'extra-1'),
      cloudflareA('3.3.3.3', 'extra-2'),
    ]);

    await setARecord('exyconn.com', IP, 600);

    expect(stubs.update).toHaveBeenCalledWith('zone-1', 'keep', {
      type: 'A',
      name: 'exyconn.com',
      content: IP,
      ttl: 600,
      proxied: true,
    });
    expect(stubs.remove.mock.calls).toEqual([
      ['zone-1', 'extra-1'],
      ['zone-1', 'extra-2'],
    ]);
    expect(stubs.create).not.toHaveBeenCalled();
  });

  it('creates an unproxied record when Cloudflare has none for the host', async () => {
    const stubs = stub(CLOUDFLARE_NS, () => Promise.resolve(zone()));
    stubs.cloudflareRead.mockResolvedValue([]);

    const result = await setARecord('www.exyconn.com', IP, 600);

    expect(stubs.create).toHaveBeenCalledWith('zone-1', {
      type: 'A',
      name: 'www.exyconn.com',
      content: IP,
      ttl: 600,
      proxied: false,
    });
    expect(result).toMatchObject({ authority: 'CLOUDFLARE', records: [] });
  });

  it('refuses a zone another provider serves', async () => {
    const stubs = stub(['ns1.elsewhere.net'], none);
    await expect(setARecord('exyconn.com', IP, 600)).rejects.toThrow(
      "exyconn.com's DNS is served by another provider",
    );
    expect(stubs.godaddyWrite).not.toHaveBeenCalled();
  });
});
