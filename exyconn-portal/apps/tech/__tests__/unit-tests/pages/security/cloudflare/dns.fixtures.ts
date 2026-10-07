import { DnsAuthority, DnsRecordStatus } from '@exyconn/shell/graphql/generated';
import type {
  DnsOverview,
  DnsRecordRow,
} from '../../../../../src/pages/security/cloudflare/dns.types';

/** One record pair as the overview returns it. */
export function record(
  key: string,
  status: DnsRecordStatus,
  fields: Partial<DnsRecordRow> = {},
): DnsRecordRow {
  return {
    key,
    type: 'A',
    name: '@',
    content: '203.0.113.10',
    priority: null,
    godaddyTtl: 600,
    cloudflareTtl: 1,
    cloudflareProxied: true,
    status,
    ...fields,
  };
}

/** A domain still answered by GoDaddy, with a Cloudflare zone that already holds everything. */
export function overview(fields: Partial<DnsOverview> = {}): DnsOverview {
  return {
    domain: 'example.com',
    authority: DnsAuthority.Godaddy,
    godaddyNameServers: ['ns01.domaincontrol.com', 'ns02.domaincontrol.com'],
    previousGodaddyNameServers: ['ns01.domaincontrol.com', 'ns02.domaincontrol.com'],
    missingOnCloudflare: 0,
    zone: {
      id: 'zone-1',
      status: 'pending',
      nameServers: ['ada.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
    },
    records: [record('a-root', DnsRecordStatus.Match)],
    ...fields,
  };
}
