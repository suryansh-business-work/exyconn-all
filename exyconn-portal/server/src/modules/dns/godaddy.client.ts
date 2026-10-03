import { ConfigurationError } from '../../utils/errors';
import { GodaddyConfigModel } from './godaddy-config.model';
import type { GodaddyRecord } from './dns.records';

const GODADDY_API_URL = 'https://api.godaddy.com';

/** The credential a call is signed with. */
interface GodaddyKey {
  apiKey: string;
  apiSecret: string;
}

/** A domain on the GoDaddy account, as the picker lists it. */
export interface GodaddyDomain {
  domain: string;
  status: string;
  nameServers: string[];
}

/**
 * What a refusal means. GoDaddy only opens its Domains API to accounts it considers eligible,
 * and says so with a 403 — worth spelling out, since the key itself is fine.
 */
function describeFailure(status: number, body: string): string {
  if (status === 401) {
    return 'GoDaddy rejected the API key or secret. Check them in Tech > Environment Variables.';
  }
  if (status === 403) {
    return `GoDaddy refused access to its Domains API for this account (${body.slice(0, 160)}). GoDaddy limits this API to eligible accounts — check the key's account on developer.godaddy.com.`;
  }
  return `GoDaddy request failed (${status}): ${body.slice(0, 200)}`;
}

/**
 * GoDaddy's Domains API: the account's domains, a domain's DNS records and its nameservers.
 * The key comes from the active GoDaddy config, so it is rotated in the portal, not a deploy.
 */
class GodaddyClient {
  private async request<T>(key: GodaddyKey, path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${GODADDY_API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `sso-key ${key.apiKey}:${key.apiSecret}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(describeFailure(response.status, await response.text()));
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  private async activeKey(): Promise<GodaddyKey> {
    const config = await GodaddyConfigModel.findOne({ isActive: true }).lean();
    if (!config) {
      throw new ConfigurationError(
        'No active GoDaddy configuration. Add one in Tech > Environment Variables.',
      );
    }
    return config;
  }

  /** Lists one domain with a specific key, to prove the key works. */
  async verify(key: GodaddyKey): Promise<void> {
    await this.request(key, '/v1/domains?limit=1');
  }

  async listDomains(): Promise<GodaddyDomain[]> {
    const rows = await this.request<
      { domain: string; status: string; nameServers?: string[] | null }[]
    >(await this.activeKey(), '/v1/domains?limit=1000');
    return rows.map((row) => ({
      domain: row.domain.toLowerCase(),
      status: row.status,
      nameServers: (row.nameServers ?? []).map((ns) => ns.toLowerCase()),
    }));
  }

  async getNameServers(domain: string): Promise<string[]> {
    const row = await this.request<{ nameServers?: string[] | null }>(
      await this.activeKey(),
      `/v1/domains/${encodeURIComponent(domain)}`,
    );
    return (row.nameServers ?? []).map((ns) => ns.toLowerCase());
  }

  listRecords(domain: string): Promise<GodaddyRecord[]> {
    return this.activeKey().then((key) =>
      this.request<GodaddyRecord[]>(key, `/v1/domains/${encodeURIComponent(domain)}/records`),
    );
  }

  /** Points the domain at these nameservers. Takes effect at the registry within minutes. */
  async setNameServers(domain: string, nameServers: readonly string[]): Promise<void> {
    await this.request(await this.activeKey(), `/v1/domains/${encodeURIComponent(domain)}`, {
      method: 'PATCH',
      body: JSON.stringify({ nameServers }),
    });
  }
}

export const godaddyClient = new GodaddyClient();
