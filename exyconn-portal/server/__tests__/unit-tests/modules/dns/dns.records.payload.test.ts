import { toCloudflarePayload, type DnsRecord } from '../../../../src/modules/dns/dns.records';

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

describe('toCloudflarePayload', () => {
  it('never proxies a moved address record and clamps the TTL into Cloudflare’s range', () => {
    expect(toCloudflarePayload(record({ ttl: 30 }))).toEqual({
      type: 'A',
      name: DOMAIN,
      ttl: 1,
      content: '203.0.113.10',
      proxied: false,
    });
    expect(toCloudflarePayload(record({ type: 'TXT', content: 'v', ttl: 999_999 }))).toEqual({
      type: 'TXT',
      name: DOMAIN,
      ttl: 86400,
      content: 'v',
    });
  });

  it('sends an MX priority, defaulting a missing one to zero', () => {
    expect(
      toCloudflarePayload(record({ type: 'MX', content: 'mx', priority: null })),
    ).toMatchObject({
      priority: 0,
    });
    expect(toCloudflarePayload(record({ type: 'MX', content: 'mx', priority: 7 }))).toMatchObject({
      priority: 7,
    });
  });

  it('splits SRV and CAA records into the data Cloudflare wants', () => {
    const srv = record({
      type: 'SRV',
      priority: 10,
      srv: { service: '_sip', proto: '_tcp', weight: 5, port: 5060, target: 'sip.example.com' },
    });
    expect(toCloudflarePayload(srv)).toMatchObject({
      data: { priority: 10, weight: 5, port: 5060, target: 'sip.example.com' },
    });
    const srvNoPriority = { ...srv, priority: null };
    expect(toCloudflarePayload(srvNoPriority)).toMatchObject({ data: { priority: 0 } });
    const caa = record({ type: 'CAA', content: '0 issue "letsencrypt.org"' });
    expect(toCloudflarePayload(caa)).toEqual({
      type: 'CAA',
      name: DOMAIN,
      ttl: 600,
      data: { flags: 0, tag: 'issue', value: 'letsencrypt.org' },
    });
  });

  it('falls back to plain content for an SRV record without its parts', () => {
    const payload = toCloudflarePayload(record({ type: 'SRV', content: '1 2 t.example.com' }));
    expect(payload).toEqual({ type: 'SRV', name: DOMAIN, ttl: 600, content: '1 2 t.example.com' });
  });
});
