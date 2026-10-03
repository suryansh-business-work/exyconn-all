/**
 * DNS records from GoDaddy and Cloudflare in one shape, and the comparison between them.
 *
 * Pure, so the migration plan can be checked without either API. A record is identified by
 * type, fully qualified name, content and (for MX) priority; TTL and Cloudflare's proxy flag
 * are shown but never make two records different, because moving a record does not have to
 * keep them.
 */

/** The types moved between providers. SOA and the apex NS set belong to whoever serves the zone. */
export const MOVABLE_TYPES = new Set(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'CAA', 'NS']);

export interface DnsRecord {
  type: string;
  /** Fully qualified, lower case, without the trailing dot. */
  name: string;
  content: string;
  ttl: number;
  priority: number | null;
  proxied: boolean | null;
  /** SRV only: the parts Cloudflare wants separately. */
  srv?: { service: string; proto: string; weight: number; port: number; target: string };
}

export type DnsRecordStatus = 'MATCH' | 'MISSING_ON_CLOUDFLARE' | 'ONLY_ON_CLOUDFLARE';

export interface DnsRecordPair {
  key: string;
  type: string;
  name: string;
  content: string;
  priority: number | null;
  godaddyTtl: number | null;
  cloudflareTtl: number | null;
  cloudflareProxied: boolean | null;
  status: DnsRecordStatus;
  /** The GoDaddy record, when there is one — what a migration copies. */
  source: DnsRecord | null;
}

/** GoDaddy's record as its API returns it. */
export interface GodaddyRecord {
  type: string;
  name: string;
  data: string;
  ttl: number;
  priority?: number;
  port?: number;
  weight?: number;
  service?: string;
  protocol?: string;
}

/** Cloudflare's record as its API returns it. */
export interface CloudflareRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied?: boolean;
}

const bare = (value: string) => value.trim().replace(/\.$/, '').toLowerCase();

/** TXT values are compared without the quotes either side may or may not wrap them in. */
const unquote = (value: string) => value.trim().replace(/^"(.*)"$/s, '$1');

/** `@` is the apex; anything else is a label under it. */
const fqdn = (label: string, domain: string) => {
  const name = bare(label);
  if (name === '@' || name === '') {
    return domain;
  }
  return name.endsWith(`.${domain}`) || name === domain ? name : `${name}.${domain}`;
};

/** Is this the zone's own NS set at the apex, which each provider manages for itself? */
const isApexNs = (type: string, name: string, domain: string) => type === 'NS' && name === domain;

export function fromGodaddy(record: GodaddyRecord, domain: string): DnsRecord | null {
  const type = record.type.toUpperCase();
  if (!MOVABLE_TYPES.has(type)) {
    return null;
  }
  const base = { type, ttl: record.ttl, priority: null, proxied: null };
  if (type === 'SRV') {
    const service = bare(record.service ?? '');
    const proto = bare(record.protocol ?? '');
    const host = fqdn(record.name, domain);
    const target = bare(record.data);
    const weight = record.weight ?? 0;
    const port = record.port ?? 0;
    return {
      ...base,
      name: `${service}.${proto}.${host}`,
      content: `${weight} ${port} ${target}`,
      priority: record.priority ?? 0,
      srv: { service, proto, weight, port, target },
    };
  }
  const name = fqdn(record.name, domain);
  if (isApexNs(type, name, domain)) {
    return null;
  }
  const hostTypes = new Set(['CNAME', 'MX', 'NS']);
  let content = record.data.trim();
  if (hostTypes.has(type)) {
    content = fqdn(record.data, domain);
  } else if (type === 'TXT') {
    content = unquote(record.data);
  }
  return { ...base, name, content, priority: type === 'MX' ? (record.priority ?? 0) : null };
}

export function fromCloudflare(record: CloudflareRecord, domain: string): DnsRecord | null {
  const type = record.type.toUpperCase();
  const name = bare(record.name);
  if (!MOVABLE_TYPES.has(type) || isApexNs(type, name, domain)) {
    return null;
  }
  let content = record.content.trim();
  if (type === 'TXT') {
    content = unquote(content);
  } else if (type === 'CNAME' || type === 'MX' || type === 'NS') {
    content = bare(content);
  } else if (type === 'SRV') {
    // Cloudflare writes SRV content as "weight port target"; the priority is separate.
    content = content.split(/\s+/).map(bare).join(' ');
  }
  const hasPriority = type === 'MX' || type === 'SRV';
  return {
    type,
    name,
    content,
    ttl: record.ttl,
    priority: hasPriority ? (record.priority ?? 0) : null,
    proxied: record.proxied ?? null,
  };
}

export const recordKey = (record: DnsRecord) =>
  [record.type, record.name, record.content, record.priority ?? ''].join(' ');

/** Every record on either side, paired: present on both, or on one side only. */
export function compareRecords(
  godaddy: readonly DnsRecord[],
  cloudflare: readonly DnsRecord[],
): DnsRecordPair[] {
  const onCloudflare = new Map(cloudflare.map((record) => [recordKey(record), record]));
  const pairs: DnsRecordPair[] = godaddy.map((record) => {
    const key = recordKey(record);
    const match = onCloudflare.get(key) ?? null;
    onCloudflare.delete(key);
    return {
      key,
      type: record.type,
      name: record.name,
      content: record.content,
      priority: record.priority,
      godaddyTtl: record.ttl,
      cloudflareTtl: match?.ttl ?? null,
      cloudflareProxied: match?.proxied ?? null,
      status: match ? 'MATCH' : 'MISSING_ON_CLOUDFLARE',
      source: record,
    };
  });
  for (const [key, record] of onCloudflare) {
    pairs.push({
      key,
      type: record.type,
      name: record.name,
      content: record.content,
      priority: record.priority,
      godaddyTtl: null,
      cloudflareTtl: record.ttl,
      cloudflareProxied: record.proxied,
      status: 'ONLY_ON_CLOUDFLARE',
      source: null,
    });
  }
  return pairs.sort((a, b) => a.name.localeCompare(b.name) || a.type.localeCompare(b.type));
}

/** Cloudflare's TTL is 1 (automatic) or 60–86400 seconds. */
const cloudflareTtl = (ttl: number) => (ttl < 60 ? 1 : Math.min(ttl, 86400));

/**
 * The body Cloudflare's create-record call takes. Nothing is proxied: a moved record must
 * answer exactly as it did on GoDaddy, and proxying is a separate decision made later.
 */
export function toCloudflarePayload(record: DnsRecord): Record<string, unknown> {
  const common = { type: record.type, name: record.name, ttl: cloudflareTtl(record.ttl) };
  if (record.type === 'SRV' && record.srv) {
    const { weight, port, target } = record.srv;
    return { ...common, data: { priority: record.priority ?? 0, weight, port, target } };
  }
  if (record.type === 'CAA') {
    const [flags, tag, ...value] = record.content.split(/\s+/);
    return {
      ...common,
      data: { flags: Number(flags), tag, value: unquote(value.join(' ')) },
    };
  }
  const proxiable = new Set(['A', 'AAAA', 'CNAME']);
  return {
    ...common,
    content: record.content,
    ...(record.type === 'MX' ? { priority: record.priority ?? 0 } : {}),
    ...(proxiable.has(record.type) ? { proxied: false } : {}),
  };
}
