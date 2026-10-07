import { authorityOf, dnsService } from '../../../../src/modules/dns/dns.service';
import { NameserverChangeModel } from '../../../../src/modules/dns/nameserver-change.model';
import { logger } from '../../../../src/utils/logger';
import {
  CLOUDFLARE_NS,
  DOMAIN,
  GODADDY_NS,
  cloudflareA,
  godaddyA,
  stubProviders,
  zone,
} from './dns.fixtures';

afterEach(() => jest.restoreAllMocks());

describe('authorityOf', () => {
  it('is Cloudflare when the registry holds exactly the zone’s nameservers', () => {
    expect(authorityOf([...CLOUDFLARE_NS].reverse(), zone())).toBe('CLOUDFLARE');
  });

  it('is GoDaddy when every nameserver is GoDaddy’s', () => {
    expect(authorityOf(GODADDY_NS, zone())).toBe('GODADDY');
    expect(authorityOf(GODADDY_NS, null)).toBe('GODADDY');
  });

  it('is somebody else for a mixed, partial or empty set', () => {
    expect(authorityOf([GODADDY_NS[0], 'ns1.other.net'], null)).toBe('OTHER');
    expect(authorityOf([CLOUDFLARE_NS[0]], zone())).toBe('OTHER');
    expect(authorityOf([], zone({ nameServers: [] }))).toBe('OTHER');
  });
});

describe('dnsService.overview', () => {
  it('refuses something that is not a domain name', async () => {
    await expect(dnsService.overview('not a domain')).rejects.toThrow(
      '"not a domain" is not a domain name.',
    );
  });

  it('lists GoDaddy’s records as missing when there is no Cloudflare zone yet', async () => {
    const stubs = stubProviders({
      godaddyRecords: [godaddyA(), { type: 'SOA', name: '@', data: 'x', ttl: 600 }],
    });

    const overview = await dnsService.overview(' Exyconn.COM ');

    expect(overview).toMatchObject({
      domain: DOMAIN,
      authority: 'GODADDY',
      godaddyNameServers: GODADDY_NS,
      previousGodaddyNameServers: [],
      zone: null,
      missingOnCloudflare: 1,
    });
    expect(overview.records.map((record) => record.status)).toEqual(['MISSING_ON_CLOUDFLARE']);
    expect(stubs.cloudflareRecords).not.toHaveBeenCalled();
  });

  it('compares both sides and recalls the GoDaddy nameservers on record', async () => {
    const stubs = stubProviders({
      nameServers: CLOUDFLARE_NS,
      godaddyRecords: [godaddyA()],
      zone: zone(),
      cloudflareRecords: [
        cloudflareA(),
        { id: 'ns', type: 'NS', name: DOMAIN, content: CLOUDFLARE_NS[0], ttl: 1 },
      ],
    });
    await NameserverChangeModel.create([
      { domain: DOMAIN, target: 'CUSTOM', previous: ['a.other.net'], next: ['b.other.net'] },
      { domain: DOMAIN, target: 'CLOUDFLARE', previous: GODADDY_NS, next: CLOUDFLARE_NS },
      { domain: 'other.com', target: 'CUSTOM', previous: ['ns9.domaincontrol.com'], next: [] },
    ]);

    const overview = await dnsService.overview(DOMAIN);

    expect(stubs.cloudflareRecords).toHaveBeenCalledWith('zone-1');
    expect(overview).toMatchObject({
      authority: 'CLOUDFLARE',
      previousGodaddyNameServers: GODADDY_NS,
      missingOnCloudflare: 0,
    });
    expect(overview.records.map((record) => record.status)).toEqual(['MATCH']);
  });
});

describe('dnsService.migrate', () => {
  const godaddyRecords = [
    godaddyA(),
    { type: 'MX', name: '@', data: 'mail.exyconn.com', ttl: 600, priority: 10 },
    { type: 'TXT', name: '@', data: 'v=spf1 -all', ttl: 600 },
    { type: 'CNAME', name: 'www', data: '@', ttl: 600 },
  ];
  const cloudflareRecords = [
    { id: 'c1', type: 'CNAME', name: 'www.exyconn.com', content: DOMAIN, ttl: 1 },
  ];

  it('creates the zone, copies what is missing, and names each copy that failed', async () => {
    const stubs = stubProviders({ godaddyRecords, cloudflareRecords });
    stubs.findZone.mockResolvedValueOnce(null).mockResolvedValue(zone());
    stubs.createRecord
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('rate limited'))
      .mockRejectedValueOnce('plain refusal');
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

    const result = await dnsService.migrate(DOMAIN);

    expect(stubs.createZone).toHaveBeenCalledWith(DOMAIN);
    expect(result).toEqual({
      created: 1,
      alreadyPresent: 1,
      failed: [
        { type: 'MX', name: DOMAIN, content: 'mail.exyconn.com', message: 'rate limited' },
        { type: 'TXT', name: DOMAIN, content: 'v=spf1 -all', message: 'plain refusal' },
      ],
      zone: zone(),
    });
    expect(stubs.createRecord).toHaveBeenNthCalledWith(1, 'zone-1', {
      type: 'A',
      name: DOMAIN,
      ttl: 600,
      content: '203.0.113.10',
      proxied: false,
    });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('uses the zone that is already there and copies nothing when nothing is missing', async () => {
    const stubs = stubProviders({
      godaddyRecords: [godaddyA()],
      zone: zone(),
      cloudflareRecords: [cloudflareA()],
    });

    const result = await dnsService.migrate(DOMAIN);

    expect(stubs.createZone).not.toHaveBeenCalled();
    expect(stubs.createRecord).not.toHaveBeenCalled();
    expect(result).toMatchObject({ created: 0, alreadyPresent: 1, failed: [] });
  });
});
