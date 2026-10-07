import { randomUUID } from 'node:crypto';
import { dnsResolvers } from '../../../../src/modules/dns';
import { dnsService } from '../../../../src/modules/dns/dns.service';
import { recordAudit } from '../../../../src/modules/audit';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { zone } from './dns.fixtures';

jest.mock('../../../../src/modules/audit', () => ({
  ...jest.requireActual('../../../../src/modules/audit'),
  recordAudit: jest.fn(),
}));

type Resolve = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = dnsResolvers.Query as unknown as Record<string, Resolve>;
const M = dnsResolvers.Mutation as unknown as Record<string, Resolve>;
const audit = jest.mocked(recordAudit);

/** A platform administrator: SUPER_ADMIN standing in no organization. */
const platform: GraphQLContext = {
  user: { id: 'admin-1', email: 'admin@example.com', roles: [ROLES.SUPER_ADMIN] },
  organizationId: null,
};
const auditOf = (index = 0) => audit.mock.calls[index][1];

beforeEach(() => audit.mockResolvedValue(undefined));
afterEach(() => jest.restoreAllMocks());

describe('dns resolvers guard', () => {
  it('refuses a caller who is not signed in, before touching the service', async () => {
    const list = jest.spyOn(dnsService, 'listGodaddyConfigs');
    await expect(Q.listGodaddyConfigs(null, {}, { user: null })).rejects.toThrow(
      'Authentication required',
    );
    expect(list).not.toHaveBeenCalled();
  });

  it('refuses a TECH user outside the platform operator organization', async () => {
    const tech: GraphQLContext = {
      user: { id: 'u2', email: 't@example.com', roles: [ROLES.TECH], organizationId: 'org-x' },
      organizationId: 'org-x',
    };
    await expect(Q.dnsDomains(null, {}, tech)).rejects.toThrow(
      'Only the platform operator may manage this.',
    );
  });
});

describe('dns queries', () => {
  it('lists both credential kinds with ids', async () => {
    jest.spyOn(dnsService, 'listGodaddyConfigs').mockResolvedValue([{ _id: 'g1' }] as never);
    jest.spyOn(dnsService, 'listCloudflareConfigs').mockResolvedValue([{ _id: 'c1' }] as never);
    await expect(Q.listGodaddyConfigs(null, {}, platform)).resolves.toEqual([
      { _id: 'g1', id: 'g1' },
    ]);
    await expect(Q.listCloudflareConfigs(null, {}, platform)).resolves.toEqual([
      { _id: 'c1', id: 'c1' },
    ]);
  });

  it('passes domains and overviews through', async () => {
    jest.spyOn(dnsService, 'listDomains').mockResolvedValue([]);
    const overview = jest.spyOn(dnsService, 'overview').mockResolvedValue({ domain: 'x' } as never);
    await expect(Q.dnsDomains(null, {}, platform)).resolves.toEqual([]);
    await expect(Q.dnsOverview(null, { domain: 'exyconn.com' }, platform)).resolves.toEqual({
      domain: 'x',
    });
    expect(overview).toHaveBeenCalledWith('exyconn.com');
  });
});

describe('dns credential mutations', () => {
  const input = { label: 'Main', apiKey: `key-${randomUUID()}`, apiSecret: '', isActive: true };

  it('creates, updates and deletes a GoDaddy credential, auditing which fields moved', async () => {
    jest.spyOn(dnsService, 'createGodaddyConfig').mockResolvedValue({ _id: 'g1' } as never);
    jest.spyOn(dnsService, 'updateGodaddyConfig').mockResolvedValue({ _id: 'g1' } as never);
    jest.spyOn(dnsService, 'deleteGodaddyConfig').mockResolvedValue(true);

    await expect(M.createGodaddyConfig(null, { input }, platform)).resolves.toMatchObject({
      id: 'g1',
    });
    await M.updateGodaddyConfig(
      null,
      { id: 'g1', input: { ...input, apiKey: undefined } },
      platform,
    );
    await expect(M.deleteGodaddyConfig(null, { id: 'g1' }, platform)).resolves.toBe(true);

    expect(auditOf(0)).toMatchObject({ action: 'CREATE', module: 'DNS', entityId: 'g1' });
    expect(auditOf(1).summary).toBe('Updated a GoDaddy API credential (label, isActive)');
    expect(auditOf(2)).toMatchObject({ action: 'DELETE', entityLabel: 'GoDaddy config' });
    expect(JSON.stringify(audit.mock.calls)).not.toContain(input.apiKey);
  });

  it('creates, updates and deletes a Cloudflare credential', async () => {
    const cf = { label: 'CF', apiToken: `tok-${randomUUID()}`, accountId: 'acc' };
    jest.spyOn(dnsService, 'createCloudflareConfig').mockResolvedValue({ _id: 'c1' } as never);
    jest.spyOn(dnsService, 'updateCloudflareConfig').mockResolvedValue({ _id: 'c1' } as never);
    jest.spyOn(dnsService, 'deleteCloudflareConfig').mockResolvedValue(true);

    await M.createCloudflareConfig(null, { input: cf }, platform);
    await M.updateCloudflareConfig(null, { id: 'c1', input: { ...cf, apiToken: '' } }, platform);
    await M.deleteCloudflareConfig(null, { id: 'c1' }, platform);

    expect(auditOf(0)).toMatchObject({
      action: 'CREATE',
      summary: 'Added a Cloudflare API credential',
    });
    expect(auditOf(1).summary).toBe('Updated a Cloudflare API credential (label, accountId)');
    expect(auditOf(2)).toMatchObject({ action: 'DELETE', entityId: 'c1' });
  });

  it('tests both connections without auditing', async () => {
    jest.spyOn(dnsService, 'testGodaddyConnection').mockResolvedValue(true);
    jest.spyOn(dnsService, 'testCloudflareConnection').mockResolvedValue(true);
    await expect(M.testGodaddyConnection(null, { id: 'g1' }, platform)).resolves.toBe(true);
    await expect(M.testCloudflareConnection(null, { id: 'c1' }, platform)).resolves.toBe(true);
    expect(audit).not.toHaveBeenCalled();
  });
});

describe('dns moves', () => {
  it('audits a migration with its counts', async () => {
    jest.spyOn(dnsService, 'migrate').mockResolvedValue({
      created: 3,
      alreadyPresent: 2,
      failed: [{ type: 'MX', name: 'x', content: 'y', message: 'z' }],
      zone: zone(),
    });
    await M.migrateDnsToCloudflare(null, { domain: 'exyconn.com' }, platform);
    expect(auditOf()).toMatchObject({
      entityId: 'zone-1',
      summary: 'Copied 3 DNS record(s) to Cloudflare (2 already there, 1 failed)',
    });
  });

  it('points the nameservers as the signed-in person, or as nobody', async () => {
    const set = jest.spyOn(dnsService, 'setNameServers').mockResolvedValue(['a.ns', 'b.ns']);
    await expect(
      M.setDomainNameservers(
        null,
        { domain: 'exyconn.com', target: 'CUSTOM', nameServers: ['a.ns'] },
        platform,
      ),
    ).resolves.toEqual(['a.ns', 'b.ns']);
    expect(set).toHaveBeenCalledWith('exyconn.com', 'CUSTOM', ['a.ns'], 'admin-1');
    expect(auditOf().summary).toBe('Pointed the nameservers at CUSTOM: a.ns, b.ns');
  });
});

describe('credential field resolvers', () => {
  const long = `tok-${randomUUID()}`;

  it('says whether a secret is stored and shows only its tail', () => {
    expect(dnsResolvers.GodaddyConfig.hasApiKey({ apiKey: long })).toBe(true);
    expect(dnsResolvers.GodaddyConfig.hasApiKey({ apiKey: '' })).toBe(false);
    expect(dnsResolvers.GodaddyConfig.hasApiSecret({})).toBe(false);
    expect(dnsResolvers.GodaddyConfig.apiKeyHint({ apiKey: long })).toBe(long.slice(-4));
    expect(dnsResolvers.CloudflareConfig.hasApiToken({ apiToken: long })).toBe(true);
    expect(dnsResolvers.CloudflareConfig.apiTokenHint({ apiToken: 'short' })).toBeNull();
  });
});
