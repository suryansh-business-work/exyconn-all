import { badRequest, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { requireSecret, withoutBlankSecret } from '../tech/tech.service';
import { cloudflareClient, type CloudflareZone } from './cloudflare.client';
import { CloudflareConfigModel } from './cloudflare-config.model';
import {
  compareRecords,
  fromCloudflare,
  fromGodaddy,
  toCloudflarePayload,
  type DnsRecord,
  type DnsRecordPair,
} from './dns.records';
import { godaddyClient } from './godaddy.client';
import { GodaddyConfigModel } from './godaddy-config.model';
import { NameserverChangeModel } from './nameserver-change.model';

export interface GodaddyConfigInput {
  label: string;
  apiKey?: string;
  apiSecret?: string;
  isActive?: boolean;
}

export interface CloudflareConfigInput {
  label: string;
  apiToken?: string;
  accountId: string;
  isActive?: boolean;
}

export type NameserverTarget = 'CLOUDFLARE' | 'GODADDY' | 'CUSTOM';
export type DnsAuthority = 'GODADDY' | 'CLOUDFLARE' | 'OTHER';

/**
 * A bare host name (`exyconn.com`, `ns1.example.net`). The same pattern as `DOMAIN` in
 * @exyconn/regex, which the portal's form validates with; the server builds without the
 * workspace packages, so it keeps its own copy for the check it repeats.
 */
const DOMAIN = /^[a-z\d-]+(?:\.[a-z\d-]+)+$/i;

/** GoDaddy's own nameservers all live under this host. */
const GODADDY_NS_SUFFIX = '.domaincontrol.com';
/** Registries accept between two and thirteen nameservers. */
const MIN_NAMESERVERS = 2;
const MAX_NAMESERVERS = 13;

export interface DnsOverview {
  domain: string;
  authority: DnsAuthority;
  godaddyNameServers: string[];
  previousGodaddyNameServers: string[];
  zone: CloudflareZone | null;
  records: DnsRecordPair[];
  missingOnCloudflare: number;
}

export interface DnsMigrationResult {
  created: number;
  alreadyPresent: number;
  failed: { type: string; name: string; content: string; message: string }[];
  zone: CloudflareZone;
}

const normaliseDomain = (value: string) => {
  const domain = value.trim().toLowerCase();
  if (!DOMAIN.test(domain)) {
    badRequest(`"${value}" is not a domain name.`);
  }
  return domain;
};

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((ns) => b.includes(ns));

/** Who answers for the domain now, judged from the nameservers the registry holds. */
export function authorityOf(
  nameServers: readonly string[],
  zone: CloudflareZone | null,
): DnsAuthority {
  if (zone && zone.nameServers.length > 0 && sameSet(nameServers, zone.nameServers)) {
    return 'CLOUDFLARE';
  }
  if (nameServers.length > 0 && nameServers.every((ns) => ns.endsWith(GODADDY_NS_SUFFIX))) {
    return 'GODADDY';
  }
  return 'OTHER';
}

/** The GoDaddy nameservers the domain had before the portal first pointed it elsewhere. */
async function godaddyNameServersOnRecord(domain: string): Promise<string[]> {
  const changes = await NameserverChangeModel.find({ domain }).sort({ createdAt: 1 }).lean();
  const before = changes.find((change) =>
    change.previous.some((ns) => ns.endsWith(GODADDY_NS_SUFFIX)),
  );
  return before?.previous ?? [];
}

async function readBothSides(domain: string) {
  const [nameServers, godaddyRows, zone] = await Promise.all([
    godaddyClient.getNameServers(domain),
    godaddyClient.listRecords(domain),
    cloudflareClient.findZone(domain),
  ]);
  const godaddy = godaddyRows
    .map((row) => fromGodaddy(row, domain))
    .filter((row): row is DnsRecord => row !== null);
  const cloudflareRows = zone ? await cloudflareClient.listRecords(zone.id) : [];
  const cloudflare = cloudflareRows
    .map((row) => fromCloudflare(row, domain))
    .filter((row): row is DnsRecord => row !== null);
  return { nameServers, zone, records: compareRecords(godaddy, cloudflare) };
}

const countMissing = (records: readonly DnsRecordPair[]) =>
  records.filter((record) => record.status === 'MISSING_ON_CLOUDFLARE').length;

/**
 * Moving exyconn.com's DNS: the credentials it runs on, the two providers' records side by
 * side, copying GoDaddy's records into Cloudflare, and pointing the domain's nameservers at
 * one or the other.
 */
export const dnsService = {
  listGodaddyConfigs: () => GodaddyConfigModel.find().sort({ createdAt: -1 }).lean(),

  async createGodaddyConfig(input: GodaddyConfigInput) {
    requireSecret(input.apiKey, 'An API key');
    requireSecret(input.apiSecret, 'An API secret');
    if (input.isActive) await GodaddyConfigModel.updateMany({}, { isActive: false });
    return (await GodaddyConfigModel.create(input)).toObject();
  },

  async updateGodaddyConfig(id: string, input: GodaddyConfigInput) {
    if (input.isActive) {
      await GodaddyConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const update = withoutBlankSecret(withoutBlankSecret(input, 'apiKey'), 'apiSecret');
    const doc = await GodaddyConfigModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!doc) notFound('GoDaddy config');
    return doc;
  },

  async deleteGodaddyConfig(id: string) {
    const doc = await GodaddyConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('GoDaddy config');
    return true;
  },

  async testGodaddyConnection(id: string) {
    const config = await GodaddyConfigModel.findById(id).lean();
    if (!config) notFound('GoDaddy config');
    await godaddyClient.verify(config);
    return true;
  },

  listCloudflareConfigs: () => CloudflareConfigModel.find().sort({ createdAt: -1 }).lean(),

  async createCloudflareConfig(input: CloudflareConfigInput) {
    requireSecret(input.apiToken, 'An API token');
    if (input.isActive) await CloudflareConfigModel.updateMany({}, { isActive: false });
    return (await CloudflareConfigModel.create(input)).toObject();
  },

  async updateCloudflareConfig(id: string, input: CloudflareConfigInput) {
    if (input.isActive) {
      await CloudflareConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const update = withoutBlankSecret(input, 'apiToken');
    const doc = await CloudflareConfigModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!doc) notFound('Cloudflare config');
    return doc;
  },

  async deleteCloudflareConfig(id: string) {
    const doc = await CloudflareConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Cloudflare config');
    return true;
  },

  async testCloudflareConnection(id: string) {
    const config = await CloudflareConfigModel.findById(id).lean();
    if (!config) notFound('Cloudflare config');
    await cloudflareClient.verify(config);
    return true;
  },

  listDomains: () => godaddyClient.listDomains(),

  async overview(value: string): Promise<DnsOverview> {
    const domain = normaliseDomain(value);
    const [{ nameServers, zone, records }, previous] = await Promise.all([
      readBothSides(domain),
      godaddyNameServersOnRecord(domain),
    ]);
    return {
      domain,
      authority: authorityOf(nameServers, zone),
      godaddyNameServers: nameServers,
      previousGodaddyNameServers: previous,
      zone,
      records,
      missingOnCloudflare: countMissing(records),
    };
  },

  /**
   * Copies every GoDaddy record Cloudflare does not have yet into the domain's Cloudflare zone,
   * creating the zone first if needed. Records already there are left alone, so running it
   * again only fills what is still missing. Nothing is deleted on either side.
   */
  async migrate(value: string): Promise<DnsMigrationResult> {
    const domain = normaliseDomain(value);
    const zone =
      (await cloudflareClient.findZone(domain)) ?? (await cloudflareClient.createZone(domain));
    const { records } = await readBothSides(domain);
    const missing = records.filter((record) => record.status === 'MISSING_ON_CLOUDFLARE');
    const failed: DnsMigrationResult['failed'] = [];
    // One at a time: Cloudflare rate-limits record writes, and a failure must name its record.
    for (const record of missing) {
      if (!record.source) continue;
      try {
        await cloudflareClient.createRecord(zone.id, toCloudflarePayload(record.source));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn({ domain, type: record.type, name: record.name }, 'DNS record copy failed');
        failed.push({ type: record.type, name: record.name, content: record.content, message });
      }
    }
    return {
      created: missing.length - failed.length,
      alreadyPresent: records.filter((record) => record.status === 'MATCH').length,
      failed,
      zone,
    };
  },

  /**
   * Points the domain's nameservers at Cloudflare, back at GoDaddy, or at a custom set.
   *
   * Moving to Cloudflare is refused while any GoDaddy record is still missing there: the moment
   * the registry switches, Cloudflare alone answers, and a missing record is a site that
   * vanishes. Back to GoDaddy restores the GoDaddy nameservers the domain had before the portal
   * first moved it. Every change is kept, newest last, with who made it.
   */
  async setNameServers(
    value: string,
    target: NameserverTarget,
    custom: readonly string[] | null | undefined,
    actorId: string,
  ): Promise<string[]> {
    const domain = normaliseDomain(value);
    const next = await nameServersFor(domain, target, custom ?? []);
    const previous = await godaddyClient.getNameServers(domain);
    if (sameSet(previous, next)) {
      return previous;
    }
    await godaddyClient.setNameServers(domain, next);
    await NameserverChangeModel.create({ domain, target, previous, next, actorId });
    return next;
  },
};

async function nameServersFor(
  domain: string,
  target: NameserverTarget,
  custom: readonly string[],
): Promise<string[]> {
  if (target === 'CLOUDFLARE') {
    const { zone, records } = await readBothSides(domain);
    if (!zone) {
      badRequest('This domain has no Cloudflare zone yet. Shift the DNS to Cloudflare first.');
    }
    const missing = countMissing(records);
    if (missing > 0) {
      badRequest(
        `${missing} GoDaddy record(s) are not on Cloudflare yet. Shift the DNS first, or the site stops resolving.`,
      );
    }
    return zone.nameServers;
  }
  if (target === 'GODADDY') {
    const previous = await godaddyNameServersOnRecord(domain);
    if (previous.length === 0) {
      badRequest('No GoDaddy nameservers are on record for this domain. Enter them as custom.');
    }
    return previous;
  }
  const hosts = [...new Set(custom.map((ns) => ns.trim().toLowerCase().replace(/\.$/, '')))];
  if (hosts.length < MIN_NAMESERVERS || hosts.length > MAX_NAMESERVERS) {
    badRequest(`Enter between ${MIN_NAMESERVERS} and ${MAX_NAMESERVERS} nameservers.`);
  }
  const invalid = hosts.filter((host) => !DOMAIN.test(host));
  if (invalid.length > 0) {
    badRequest(`Not a nameserver host name: ${invalid.join(', ')}`);
  }
  return hosts;
}
