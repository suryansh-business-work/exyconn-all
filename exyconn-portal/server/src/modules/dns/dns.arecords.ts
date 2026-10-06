import { isIPv4 } from 'node:net';
import { badRequest } from '../../utils/errors';
import { cloudflareClient } from './cloudflare.client';
import { authorityOf, type DnsAuthority } from './dns.service';
import { godaddyClient } from './godaddy.client';

/** GoDaddy refuses a TTL below ten minutes; Cloudflare accepts it too. */
export const MIN_A_TTL = 600;
const MAX_A_TTL = 86_400;

/** A host name split into the registered domain it lives under and its name within it. */
export interface HostInZone {
  host: string;
  zone: string;
  /** '@' for the domain itself, else the labels before it ('www', 'blog.eu'). */
  name: string;
}

/** Who answers for a host's name now, and the A records it serves there. */
export interface HostARecords extends HostInZone {
  authority: DnsAuthority;
  records: Array<{ ip: string; ttl: number }>;
}

/** The registered domain (from the GoDaddy account) that a host belongs to. */
export async function hostInZone(host: string): Promise<HostInZone> {
  const domains = await godaddyClient.listDomains();
  const zone = domains
    .map((row) => row.domain)
    .filter((domain) => host === domain || host.endsWith(`.${domain}`))
    .sort((a, b) => b.length - a.length)[0];
  if (!zone) {
    badRequest(`${host} is not a domain on the GoDaddy account in Tech › Environment Variables.`);
  }
  const name = host === zone ? '@' : host.slice(0, -(zone.length + 1));
  return { host, zone, name };
}

/** Who serves the zone's DNS: GoDaddy's nameservers, Cloudflare's, or somebody else. */
async function authorityFor(zone: string) {
  const [nameServers, cloudflareZone] = await Promise.all([
    godaddyClient.getNameServers(zone),
    cloudflareClient.findZone(zone).catch(() => null),
  ]);
  return { authority: authorityOf(nameServers, cloudflareZone), cloudflareZone };
}

/** A host's A records, read from whichever provider answers for it. */
export async function readARecords(host: string): Promise<HostARecords> {
  const where = await hostInZone(host);
  const { authority, cloudflareZone } = await authorityFor(where.zone);
  if (authority === 'GODADDY') {
    const rows = await godaddyClient.aRecords(where.zone, where.name);
    return { ...where, authority, records: rows.map((row) => ({ ip: row.data, ttl: row.ttl })) };
  }
  if (authority === 'CLOUDFLARE' && cloudflareZone) {
    const rows = await cloudflareClient.aRecords(cloudflareZone.id, host);
    return { ...where, authority, records: rows.map((row) => ({ ip: row.content, ttl: row.ttl })) };
  }
  return { ...where, authority, records: [] };
}

/**
 * Points a host at one IPv4 address: its A records at whichever provider answers for it become
 * exactly this one (a record already there is updated, extra ones removed). A zone served by
 * neither GoDaddy nor Cloudflare is refused — writing elsewhere would change nothing.
 */
export async function setARecord(host: string, ip: string, ttl: number): Promise<HostARecords> {
  if (!isIPv4(ip)) {
    badRequest('Enter an IPv4 address, like 203.0.113.10.');
  }
  if (!Number.isInteger(ttl) || ttl < MIN_A_TTL || ttl > MAX_A_TTL) {
    badRequest(`Use a TTL between ${MIN_A_TTL} and ${MAX_A_TTL} seconds.`);
  }
  const where = await hostInZone(host);
  const { authority, cloudflareZone } = await authorityFor(where.zone);
  if (authority === 'GODADDY') {
    await godaddyClient.setARecords(where.zone, where.name, [{ data: ip, ttl }]);
  } else if (authority === 'CLOUDFLARE' && cloudflareZone) {
    const [first, ...extra] = await cloudflareClient.aRecords(cloudflareZone.id, host);
    const payload = { type: 'A', name: host, content: ip, ttl, proxied: first?.proxied ?? false };
    if (first) {
      await cloudflareClient.updateRecord(cloudflareZone.id, first.id, payload);
    } else {
      await cloudflareClient.createRecord(cloudflareZone.id, payload);
    }
    for (const record of extra) {
      await cloudflareClient.deleteRecord(cloudflareZone.id, record.id);
    }
  } else {
    badRequest(`${where.zone}'s DNS is served by another provider; change the record there.`);
  }
  return readARecords(host);
}
