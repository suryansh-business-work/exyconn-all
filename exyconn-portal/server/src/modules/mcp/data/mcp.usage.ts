import { Types } from 'mongoose';
import { runAsPlatform } from '../../../lib/tenant';
import { notFound } from '../../../utils/errors';
import { escapeRegex } from '../../../utils/tableQuery';
import { UserModel } from '../../admin/user.model';
import { McpCallModel, McpTokenModel } from './mcp.models';
import { assertDays, windowStart } from './mcp.analytics';
import type { McpEndpointKey, McpServerKey } from '../servers';

/** The most calls the activity log lists at once. */
export const MAX_MCP_ACTIVITY = 500;

export { MAX_MCP_DAYS, mcpErrors, mcpUsage } from './mcp.analytics';

/** What the activity log narrows to: the outcome, and a trace id, tool or person to look for. */
export interface McpActivityFilter {
  ok?: boolean | null;
  search?: string | null;
}

/** The query a filter makes: a trace id matches exactly, a tool or person by part of the name. */
function filterOf(filter: McpActivityFilter): Record<string, unknown> {
  const match: Record<string, unknown> = {};
  if (typeof filter.ok === 'boolean') match.ok = filter.ok;
  const search = filter.search?.trim();
  if (search) {
    const part = new RegExp(escapeRegex(search), 'i');
    match.$or = [{ traceId: search }, { tool: part }, { userName: part }];
  }
  return match;
}

/** The newest calls of the window, for a server's activity log. */
export async function mcpActivity(
  servers: readonly McpServerKey[],
  days: number,
  limit = 200,
  now = new Date(),
  filter: McpActivityFilter = {},
) {
  assertDays(days);
  const take = Math.min(Math.max(1, Math.floor(limit)), MAX_MCP_ACTIVITY);
  const rows = await McpCallModel.find({
    server: { $in: servers },
    at: { $gte: windowStart(days, now) },
    ...filterOf(filter),
  })
    .sort({ at: -1 })
    .limit(take)
    .lean();
  return rows.map((row) => ({ ...row, id: String(row._id) }));
}

/** The company's live connections to these endpoints, with who each acts for. */
export async function mcpConnections(organizationId: string, endpoints: readonly McpEndpointKey[]) {
  const rows = await runAsPlatform(() =>
    McpTokenModel.find({
      organizationId,
      endpoint: { $in: endpoints },
      revokedAt: null,
      refreshExpiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean(),
  );
  const users = await runAsPlatform(() =>
    UserModel.find({ _id: { $in: rows.map((row) => row.userId) } })
      .select('name')
      .lean(),
  );
  const names = new Map(users.map((user) => [String(user._id), user.name]));
  return rows.map((row) => ({
    id: String(row._id),
    endpoint: row.endpoint,
    clientName: row.clientName || 'MCP client',
    userName: names.get(row.userId) ?? '',
    readOnly: row.readOnly ?? false,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
  }));
}

/** The endpoint a live connection of this company points at, or NOT_FOUND. */
export async function connectionEndpoint(
  organizationId: string,
  id: string,
): Promise<McpEndpointKey> {
  if (!Types.ObjectId.isValid(id)) notFound('Connection');
  const row = await runAsPlatform(() =>
    McpTokenModel.findOne({ _id: id, organizationId, revokedAt: null }).select('endpoint').lean(),
  );
  if (!row) notFound('Connection');
  return row.endpoint;
}

/** Signs one connection of this company out. */
export async function revokeMcpConnection(organizationId: string, id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) notFound('Connection');
  const result = await runAsPlatform(() =>
    McpTokenModel.updateOne(
      { _id: id, organizationId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    ),
  );
  if (result.modifiedCount === 0) notFound('Connection');
  return true;
}

/** How many live connections the company has to each endpoint. */
export async function connectionCounts(organizationId: string): Promise<Map<string, number>> {
  const rows = await runAsPlatform(() =>
    McpTokenModel.aggregate<{ _id: string; count: number }>([
      { $match: { organizationId, revokedAt: null, refreshExpiresAt: { $gt: new Date() } } },
      { $group: { _id: '$endpoint', count: { $sum: 1 } } },
    ]),
  );
  return new Map(rows.map((row) => [row._id, row.count]));
}
