import { ConfigurationError } from '../../utils/errors';
import { CloudflareConfigModel } from './cloudflare-config.model';
import type { CloudflareRecord } from './dns.records';

const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';
/** Records are read a page at a time; this is Cloudflare's own ceiling for one page. */
const RECORDS_PER_PAGE = 1000;

interface CloudflareKey {
  apiToken: string;
  accountId: string;
}

/** A domain's zone on Cloudflare: its status and the nameservers Cloudflare assigned it. */
export interface CloudflareZone {
  id: string;
  status: string;
  nameServers: string[];
  originalNameServers: string[];
}

interface Envelope<T> {
  success: boolean;
  errors?: { code: number; message: string }[];
  result: T;
  result_info?: { page: number; total_pages: number };
}

interface ZonePayload {
  id: string;
  status: string;
  name_servers?: string[];
  original_name_servers?: string[] | null;
}

const toZone = (zone: ZonePayload): CloudflareZone => ({
  id: zone.id,
  status: zone.status,
  nameServers: (zone.name_servers ?? []).map((ns) => ns.toLowerCase()),
  originalNameServers: (zone.original_name_servers ?? []).map((ns) => ns.toLowerCase()),
});

/**
 * Cloudflare's API: a domain's zone (created on first move), its DNS records, and the
 * nameservers Cloudflare assigned it. The token comes from the active Cloudflare config.
 */
class CloudflareClient {
  private async request<T>(
    key: CloudflareKey,
    path: string,
    init: RequestInit = {},
  ): Promise<Envelope<T>> {
    const response = await fetch(`${CLOUDFLARE_API_URL}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${key.apiToken}`, 'Content-Type': 'application/json' },
    });
    const body = (await response.json().catch(() => null)) as Envelope<T> | null;
    if (!response.ok || !body?.success) {
      const reason = body?.errors?.map((error) => error.message).join('; ');
      throw new Error(`Cloudflare request failed (${response.status}): ${reason ?? 'no detail'}`);
    }
    return body;
  }

  async activeKey(): Promise<CloudflareKey> {
    const config = await CloudflareConfigModel.findOne({ isActive: true }).lean();
    if (!config) {
      throw new ConfigurationError(
        'No active Cloudflare configuration. Add one in Tech > Environment Variables.',
      );
    }
    return config;
  }

  /** Asks Cloudflare whether a specific token is valid and active. */
  async verify(key: CloudflareKey): Promise<void> {
    await this.request(key, '/user/tokens/verify');
  }

  async findZone(domain: string): Promise<CloudflareZone | null> {
    const body = await this.request<ZonePayload[]>(
      await this.activeKey(),
      `/zones?name=${encodeURIComponent(domain)}`,
    );
    const [zone] = body.result;
    return zone ? toZone(zone) : null;
  }

  /** Adds the domain to the account as a full zone, without importing anything itself. */
  async createZone(domain: string): Promise<CloudflareZone> {
    const key = await this.activeKey();
    const body = await this.request<ZonePayload>(key, '/zones', {
      method: 'POST',
      body: JSON.stringify({
        name: domain,
        account: { id: key.accountId },
        type: 'full',
        jump_start: false,
      }),
    });
    return toZone(body.result);
  }

  async listRecords(zoneId: string): Promise<CloudflareRecord[]> {
    const key = await this.activeKey();
    const records: CloudflareRecord[] = [];
    let page = 1;
    let pages: number;
    do {
      const body = await this.request<CloudflareRecord[]>(
        key,
        `/zones/${zoneId}/dns_records?per_page=${RECORDS_PER_PAGE}&page=${page}`,
      );
      records.push(...body.result);
      pages = body.result_info?.total_pages ?? 1;
      page += 1;
    } while (page <= pages);
    return records;
  }

  async createRecord(zoneId: string, payload: Record<string, unknown>): Promise<void> {
    await this.request(await this.activeKey(), `/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const cloudflareClient = new CloudflareClient();
