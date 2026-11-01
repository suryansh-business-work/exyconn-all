import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { badRequest, notFound } from '../../utils/errors';
import { withIds } from '../../utils/serialize';
import { tableQuery, tableStats, type TableQueryInput } from '../../utils/tableQuery';
import type { GraphQLContext } from '../../middleware/auth';
import { registerTable } from '../table-transfer/registry';
import { liveSchema, serverTools } from '../mcp/core/mcp.catalogue';
import type { McpServerKey } from '../mcp/servers';
import { ApiKeyModel } from './api-key.model';
import { ApiKeyUsageModel } from './api-key-usage.model';
import { WebhookDeliveryModel, WebhookModel, WEBHOOK_EVENTS } from './webhook.model';
import { webhookEventCatalogue } from './webhook.catalogue';

/** The developer portal is an administrator's, like the keys and endpoints it manages. */
const developerRoles = [ROLES.ADMIN];
const MAX_USAGE_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DELIVERY_TABLE = {
  searchFields: ['event', 'status', 'error'],
  filterFields: ['webhookId', 'event', 'status'],
  sortFields: ['event', 'status', 'attempts', 'createdAt', 'deliveredAt'],
  defaultSort: { field: 'createdAt', dir: 'DESC' as const },
};
registerTable('listWebhookDeliveriesPaged', DELIVERY_TABLE);

/** The last `days` UTC days, oldest first, as YYYY-MM-DD. */
function lastDays(days: number, now = Date.now()): string[] {
  return Array.from({ length: days }, (_, index) =>
    new Date(now - (days - 1 - index) * MS_PER_DAY).toISOString().slice(0, 10),
  );
}

async function apiKeyUsage(_p: unknown, args: { id: string; days: number }, ctx: GraphQLContext) {
  assertRole(ctx, developerRoles);
  if (!Number.isInteger(args.days) || args.days < 1 || args.days > MAX_USAGE_DAYS) {
    badRequest('Choose between 1 and 90 days.');
  }
  if (!(await ApiKeyModel.exists({ _id: args.id }))) {
    notFound('API key');
  }
  const days = lastDays(args.days);
  const rows = await ApiKeyUsageModel.find({ apiKeyId: args.id, day: { $gte: days[0] } })
    .select('day count')
    .lean();
  const byDay = new Map(rows.map((row) => [row.day, row.count]));
  return days.map((day) => ({ day, count: byDay.get(day) ?? 0 }));
}

/** One page of the delivery log, each row named after its endpoint in one extra read. */
async function listWebhookDeliveriesPaged(
  _p: unknown,
  { input }: { input: TableQueryInput },
  ctx: GraphQLContext,
) {
  assertRole(ctx, developerRoles);
  const page = await tableQuery(WebhookDeliveryModel, input, DELIVERY_TABLE);
  const rows = withIds(page.rows as Array<{ _id: unknown; webhookId: string }>);
  const hooks = await WebhookModel.find({ _id: { $in: rows.map((row) => row.webhookId) } })
    .select('name')
    .lean();
  const names = new Map(hooks.map((hook) => [String(hook._id), hook.name]));
  return {
    rows: rows.map((row) => ({ ...row, webhookName: names.get(row.webhookId) ?? '' })),
    totalCount: page.totalCount,
  };
}

/** The type a root field answers with, as GraphQL spells it. */
function returnTypeOf(kind: 'QUERY' | 'MUTATION', name: string): string {
  const schema = liveSchema();
  const root = kind === 'QUERY' ? schema.getQueryType() : schema.getMutationType();
  const field = root?.getFields()[name];
  return field ? String(field.type) : '';
}

/**
 * A module's operations, from the same catalogue the MCP servers are built from — one set of
 * descriptions serves Claude and developers alike. The MCP access note is left off.
 */
function apiReference(_p: unknown, { endpoint }: { endpoint: string }, ctx: GraphQLContext) {
  assertRole(ctx, developerRoles);
  if (endpoint === 'ALL') {
    badRequest('Choose one module.');
  }
  const key = endpoint.toLowerCase() as McpServerKey;
  return serverTools(key).map((tool) => ({
    name: tool.name,
    kind: tool.kind,
    description: tool.description.split('\n\n')[0],
    arguments: tool.args,
    returnType: returnTypeOf(tool.kind, tool.name),
    example: tool.document,
  }));
}

export const developerResolvers = {
  Query: {
    apiKeyUsage,
    webhookEventCatalogue: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, developerRoles);
      return webhookEventCatalogue(WEBHOOK_EVENTS);
    },
    listWebhookDeliveriesPaged,
    listWebhookDeliveriesStats: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, developerRoles);
      return tableStats(WebhookDeliveryModel, { countBy: ['status', 'event'] });
    },
    apiReference,
  },
};
