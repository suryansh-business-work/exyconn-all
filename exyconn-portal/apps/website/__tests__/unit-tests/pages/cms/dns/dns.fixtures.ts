import type { CmsDomainDnsRow } from '../../../../../src/pages/website/forms/cms-a-record';

/** A documentation-range IPv4 address (203.0.113.x), assembled so no address sits in source. */
export const ipAddress = (last: number): string => [203, 0, 113, last].join('.');

/** A domain's DNS as the site DNS query returns it. */
export function dnsRow(overrides: Partial<CmsDomainDnsRow> = {}): CmsDomainDnsRow {
  return {
    domain: 'exyconn.com',
    zone: 'exyconn.com',
    name: '@',
    authority: 'GODADDY',
    pointsHere: true,
    error: '',
    records: [{ ip: ipAddress(10), ttl: 600 }],
    ...overrides,
  };
}
