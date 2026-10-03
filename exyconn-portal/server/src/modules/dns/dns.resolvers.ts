import { assertPlatformStaff } from '../../lib/platformAccess';
import { ROLES } from '../../constants/roles';
import { withId, withIds } from '../../utils/serialize';
import { recordAudit } from '../audit';
import { secretHint } from '../tech/tech.secrets';
import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';
import {
  dnsService,
  type CloudflareConfigInput,
  type GodaddyConfigInput,
  type NameserverTarget,
} from './dns.service';

/**
 * Who may move exyconn.com's DNS: the platform's own Tech staff only — the same line the other
 * platform credentials draw (lib/platformAccess), under the Tech module's permission entry.
 */
const TECH_MODULE = 'TechConfig';
const guard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, TECH_MODULE, [ROLES.TECH], action);

type Row = Record<string, unknown>;
const has = (field: string) => (row: Row) => typeof row[field] === 'string' && row[field] !== '';
const hint = (field: string) => (row: Row) => secretHint(row[field]);

/** Records a DNS change. Never the secret: only which fields moved. */
const audit = (
  ctx: GraphQLContext,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  summary: string,
  entityId?: unknown,
) => recordAudit(ctx, { action, module: 'DNS', entityId, entityLabel: entity, summary });

const changedFields = (input: object) =>
  Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([field]) => field)
    .join(', ');

export const dnsResolvers = {
  Query: {
    listGodaddyConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return withIds(await dnsService.listGodaddyConfigs());
    },
    listCloudflareConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return withIds(await dnsService.listCloudflareConfigs());
    },
    dnsDomains: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return dnsService.listDomains();
    },
    dnsOverview: async (_p: unknown, { domain }: { domain: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return dnsService.overview(domain);
    },
  },
  Mutation: {
    createGodaddyConfig: async (
      _p: unknown,
      { input }: { input: GodaddyConfigInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'CREATE');
      const doc = withId(await dnsService.createGodaddyConfig(input));
      await audit(ctx, 'CREATE', input.label, 'Added a GoDaddy API credential', doc.id);
      return doc;
    },
    updateGodaddyConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: GodaddyConfigInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const doc = withId(await dnsService.updateGodaddyConfig(id, input));
      await audit(
        ctx,
        'UPDATE',
        input.label,
        `Updated a GoDaddy API credential (${changedFields(input)})`,
        id,
      );
      return doc;
    },
    deleteGodaddyConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'DELETE');
      const done = await dnsService.deleteGodaddyConfig(id);
      await audit(ctx, 'DELETE', 'GoDaddy config', 'Deleted a GoDaddy API credential', id);
      return done;
    },
    testGodaddyConnection: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return dnsService.testGodaddyConnection(id);
    },
    createCloudflareConfig: async (
      _p: unknown,
      { input }: { input: CloudflareConfigInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'CREATE');
      const doc = withId(await dnsService.createCloudflareConfig(input));
      await audit(ctx, 'CREATE', input.label, 'Added a Cloudflare API credential', doc.id);
      return doc;
    },
    updateCloudflareConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: CloudflareConfigInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const doc = withId(await dnsService.updateCloudflareConfig(id, input));
      await audit(
        ctx,
        'UPDATE',
        input.label,
        `Updated a Cloudflare API credential (${changedFields(input)})`,
        id,
      );
      return doc;
    },
    deleteCloudflareConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'DELETE');
      const done = await dnsService.deleteCloudflareConfig(id);
      await audit(ctx, 'DELETE', 'Cloudflare config', 'Deleted a Cloudflare API credential', id);
      return done;
    },
    testCloudflareConnection: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return dnsService.testCloudflareConnection(id);
    },
    migrateDnsToCloudflare: async (
      _p: unknown,
      { domain }: { domain: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const result = await dnsService.migrate(domain);
      await audit(
        ctx,
        'UPDATE',
        domain,
        `Copied ${result.created} DNS record(s) to Cloudflare (${result.alreadyPresent} already there, ${result.failed.length} failed)`,
        result.zone.id,
      );
      return result;
    },
    setDomainNameservers: async (
      _p: unknown,
      {
        domain,
        target,
        nameServers,
      }: { domain: string; target: NameserverTarget; nameServers?: string[] | null },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const next = await dnsService.setNameServers(domain, target, nameServers, ctx.user?.id ?? '');
      await audit(
        ctx,
        'UPDATE',
        domain,
        `Pointed the nameservers at ${target}: ${next.join(', ')}`,
      );
      return next;
    },
  },
  GodaddyConfig: {
    hasApiKey: has('apiKey'),
    apiKeyHint: hint('apiKey'),
    hasApiSecret: has('apiSecret'),
  },
  CloudflareConfig: {
    hasApiToken: has('apiToken'),
    apiTokenHint: hint('apiToken'),
  },
};
