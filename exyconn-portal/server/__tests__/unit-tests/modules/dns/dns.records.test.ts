import {
  compareRecords,
  fromCloudflare,
  fromGodaddy,
  recordKey,
  type DnsRecord,
} from '../../../../src/modules/dns/dns.records';

const DOMAIN = 'example.com';

const record = (fields: Partial<DnsRecord>): DnsRecord => ({
  type: 'A',
  name: DOMAIN,
  content: '203.0.113.10',
  ttl: 600,
  priority: null,
  proxied: null,
  ...fields,
});

describe('fromGodaddy', () => {
  it('skips the types each provider manages for itself', () => {
    expect(fromGodaddy({ type: 'SOA', name: '@', data: 'x', ttl: 600 }, DOMAIN)).toBeNull();
    expect(
      fromGodaddy({ type: 'NS', name: '@', data: 'ns1.domaincontrol.com', ttl: 600 }, DOMAIN),
    ).toBeNull();
  });

  it('reads an apex A record with its value trimmed', () => {
    expect(
      fromGodaddy({ type: 'a', name: '@', data: ' 203.0.113.10 ', ttl: 3600 }, DOMAIN),
    ).toEqual({
      type: 'A',
      name: DOMAIN,
      content: '203.0.113.10',
      ttl: 3600,
      priority: null,
      proxied: null,
    });
  });

  it('qualifies host names in the name and in host-type values', () => {
    const cname = fromGodaddy({ type: 'CNAME', name: 'www', data: '@', ttl: 600 }, DOMAIN);
    expect(cname).toMatchObject({ name: 'www.example.com', content: DOMAIN });
    const mx = fromGodaddy({ type: 'MX', name: '', data: 'mail', ttl: 600 }, DOMAIN);
    expect(mx).toMatchObject({ name: DOMAIN, content: 'mail.example.com', priority: 0 });
    const ns = fromGodaddy(
      { type: 'NS', name: 'Eu.Example.com.', data: 'ns1.example.com.', ttl: 600 },
      DOMAIN,
    );
    expect(ns).toMatchObject({ name: 'eu.example.com', content: 'ns1.example.com' });
  });

  it('keeps an MX priority and strips the quotes around a TXT value', () => {
    const mx = fromGodaddy(
      { type: 'MX', name: '@', data: 'mx.example.com', ttl: 600, priority: 10 },
      DOMAIN,
    );
    expect(mx?.priority).toBe(10);
    const txt = fromGodaddy({ type: 'TXT', name: '@', data: '"v=spf1 -all"', ttl: 600 }, DOMAIN);
    expect(txt).toMatchObject({ content: 'v=spf1 -all', priority: null });
  });

  it('spells an SRV record the way Cloudflare names it', () => {
    const srv = fromGodaddy(
      {
        type: 'SRV',
        name: '@',
        data: 'sip.example.com.',
        ttl: 600,
        service: '_sip',
        protocol: '_TCP',
        priority: 10,
        weight: 5,
        port: 5060,
      },
      DOMAIN,
    );
    expect(srv).toEqual({
      type: 'SRV',
      name: '_sip._tcp.example.com',
      content: '5 5060 sip.example.com',
      ttl: 600,
      priority: 10,
      proxied: null,
      srv: { service: '_sip', proto: '_tcp', weight: 5, port: 5060, target: 'sip.example.com' },
    });
  });

  it('defaults the SRV parts GoDaddy leaves out to zero', () => {
    const srv = fromGodaddy(
      { type: 'SRV', name: 'voip', data: 'pbx.example.com', ttl: 600 },
      DOMAIN,
    );
    expect(srv).toMatchObject({ content: '0 0 pbx.example.com', priority: 0 });
    expect(srv?.srv).toEqual({
      service: '',
      proto: '',
      weight: 0,
      port: 0,
      target: 'pbx.example.com',
    });
  });
});

describe('fromCloudflare', () => {
  const cf = (fields: Partial<Parameters<typeof fromCloudflare>[0]>) =>
    fromCloudflare(
      { id: 'r1', type: 'A', name: DOMAIN, content: '1.1.1.1', ttl: 1, ...fields },
      DOMAIN,
    );

  it('skips unmovable types and the apex NS set', () => {
    expect(cf({ type: 'SOA' })).toBeNull();
    expect(cf({ type: 'NS', name: 'Example.com.', content: 'a.ns.cloudflare.com' })).toBeNull();
  });

  it('normalises each kind of value for comparison', () => {
    expect(cf({ type: 'TXT', content: ' "hello world" ' })?.content).toBe('hello world');
    expect(cf({ type: 'CNAME', name: 'www.example.com', content: 'Example.com.' })?.content).toBe(
      DOMAIN,
    );
    expect(cf({ type: 'NS', name: 'eu.example.com', content: 'NS1.Other.net.' })?.content).toBe(
      'ns1.other.net',
    );
    expect(cf({ type: 'SRV', content: '5  5060 Sip.Example.com.' })?.content).toBe(
      '5 5060 sip.example.com',
    );
  });

  it('carries a priority only for MX and SRV, and the proxy flag when given', () => {
    expect(cf({ type: 'MX', content: 'mx.example.com', priority: 20 })).toMatchObject({
      priority: 20,
    });
    expect(cf({ type: 'SRV', content: '1 2 t.example.com' })).toMatchObject({ priority: 0 });
    expect(cf({ proxied: true })).toMatchObject({ priority: null, proxied: true });
    expect(cf({})).toMatchObject({ proxied: null, content: '1.1.1.1' });
  });
});

describe('recordKey and compareRecords', () => {
  it('identifies a record by type, name, content and priority', () => {
    expect(recordKey(record({}))).toBe('A example.com 203.0.113.10 ');
    expect(recordKey(record({ type: 'MX', content: 'mx', priority: 5 }))).toBe(
      'MX example.com mx 5',
    );
  });

  it('pairs matches, flags what Cloudflare lacks and what only Cloudflare has, sorted', () => {
    const shared = record({ name: 'b.example.com' });
    const goOnly = record({ name: 'a.example.com', type: 'TXT', content: 'x' });
    const cfOnly = record({ name: 'b.example.com', type: 'AAAA', content: '::1', proxied: true });
    const pairs = compareRecords(
      [shared, goOnly],
      [{ ...shared, ttl: 300, proxied: false }, cfOnly],
    );

    expect(pairs.map((p) => [p.name, p.type, p.status])).toEqual([
      ['a.example.com', 'TXT', 'MISSING_ON_CLOUDFLARE'],
      ['b.example.com', 'A', 'MATCH'],
      ['b.example.com', 'AAAA', 'ONLY_ON_CLOUDFLARE'],
    ]);
    expect(pairs[1]).toMatchObject({
      godaddyTtl: 600,
      cloudflareTtl: 300,
      cloudflareProxied: false,
    });
    expect(pairs[0]).toMatchObject({
      cloudflareTtl: null,
      cloudflareProxied: null,
      source: goOnly,
    });
    expect(pairs[2]).toMatchObject({ godaddyTtl: null, cloudflareProxied: true, source: null });
  });
});
