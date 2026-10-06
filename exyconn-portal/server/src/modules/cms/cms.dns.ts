import { env } from '../../config/env';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { readARecords, setARecord } from '../dns';
import { cmsSites, normalizeHost } from './cms.sites';

/** One domain of a site and where it points now. */
export interface CmsDomainDns {
  domain: string;
  zone: string;
  name: string;
  /** GODADDY, CLOUDFLARE, OTHER, or UNKNOWN when it could not be read. */
  authority: string;
  records: Array<{ ip: string; ttl: number }>;
  /** True when every A record is the websites' server address (WEBSITE_SERVER_IP). */
  pointsHere: boolean;
  /** Why it could not be read (no GoDaddy access, not on the account…); '' when it was. */
  error: string;
}

const pointsAtServer = (records: CmsDomainDns['records']) =>
  env.websiteServerIp !== '' &&
  records.length > 0 &&
  records.every((record) => record.ip === env.websiteServerIp);

async function domainDns(domain: string): Promise<CmsDomainDns> {
  try {
    const found = await readARecords(domain);
    return {
      domain,
      zone: found.zone,
      name: found.name,
      authority: found.authority,
      records: found.records,
      pointsHere: pointsAtServer(found.records),
      error: '',
    };
  } catch (error) {
    logger.warn({ err: error, domain }, 'Could not read a website domain’s DNS');
    const message = error instanceof Error ? error.message : 'Could not read the DNS records.';
    return {
      domain,
      zone: '',
      name: '',
      authority: 'UNKNOWN',
      records: [],
      pointsHere: false,
      error: message,
    };
  }
}

/** Website › Settings › Domains: every domain of the site and its A records. */
export async function siteDns(siteId: string) {
  const site = await cmsSites.get(siteId);
  return {
    serverIp: env.websiteServerIp,
    domains: await Promise.all(site.domains.map(domainDns)),
  };
}

/** Points one of the site's domains at an address (an A record at its DNS provider). */
export async function setSiteARecord(siteId: string, domain: string, ip: string, ttl: number) {
  const site = await cmsSites.get(siteId);
  const host = normalizeHost(domain);
  if (!site.domains.includes(host)) {
    badRequest(`${host} is not one of this website's domains. Add it in the settings first.`);
  }
  await setARecord(host, ip.trim(), ttl);
  logger.info(`A record for ${host} set to ${ip.trim()} (website ${site.slug})`);
  return domainDns(host);
}
