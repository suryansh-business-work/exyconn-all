import { Types } from 'mongoose';
import { runAsPlatform } from '../../../lib/tenant';
import { badRequest, notFound } from '../../../utils/errors';
import { UserModel } from '../../admin/user.model';
import { McpCallModel, McpTokenModel } from './mcp.models';
import type { McpEndpointKey, McpServerKey } from '../servers';

/** The longest window the usage dashboard and activity log read. */
export const MAX_MCP_DAYS = 180;
/** The most calls the activity log lists at once. */
export const MAX_MCP_ACTIVITY = 500;

const DAY_MS = 24 * 60 * 60 * 1000;

interface CallRow {
  _id: unknown;
  at: Date;
  userName: string;
  tool: string;
  ok: boolean;
  durationMs: number;
}

function assertDays(days: number): void {
  if (!Number.isInteger(days) || days < 1 || days > MAX_MCP_DAYS) {
    badRequest(`Ask for 1 to ${MAX_MCP_DAYS} days.`);
  }
}

/** The UTC days of the window, oldest first. */
function windowOf(days: number, now: Date): string[] {
  return Array.from({ length: days }, (_, index) =>
    new Date(now.getTime() - (days - 1 - index) * DAY_MS).toISOString().slice(0, 10),
  );
}

/**
 * The company's calls to these module servers since the start of the window (the tenant scope
 * confines them to the company).
 */
function callsSince(servers: readonly McpServerKey[], days: number, now: Date) {
  const from = new Date(`${windowOf(days, now)[0]}T00:00:00.000Z`);
  return McpCallModel.find({ server: { $in: servers }, at: { $gte: from } }).sort({ at: -1 });
}

/** Calls, failures and people over the window, a point per day, and by tool and person. */
export async function mcpUsage(servers: readonly McpServerKey[], days: number, now = new Date()) {
  assertDays(days);
  const rows = await callsSince(servers, days, now)
    .select('at userName tool ok durationMs')
    .lean<CallRow[]>();
  const perDay = new Map(windowOf(days, now).map((day) => [day, { day, calls: 0, failures: 0 }]));
  const perTool = new Map<string, { tool: string; calls: number; failures: number; ms: number }>();
  const perUser = new Map<string, number>();
  for (const row of rows) {
    const day = perDay.get(row.at.toISOString().slice(0, 10));
    if (day) {
      day.calls += 1;
      day.failures += row.ok ? 0 : 1;
    }
    const tool = perTool.get(row.tool) ?? { tool: row.tool, calls: 0, failures: 0, ms: 0 };
    tool.calls += 1;
    tool.failures += row.ok ? 0 : 1;
    tool.ms += row.durationMs;
    perTool.set(row.tool, tool);
    perUser.set(row.userName, (perUser.get(row.userName) ?? 0) + 1);
  }
  return {
    calls: rows.length,
    failures: rows.filter((row) => !row.ok).length,
    people: perUser.size,
    days: [...perDay.values()],
    tools: [...perTool.values()]
      .map(({ ms, ...tool }) => ({ ...tool, averageMs: ms / tool.calls }))
      .sort((a, b) => b.calls - a.calls),
    users: [...perUser]
      .map(([userName, calls]) => ({ userName, calls }))
      .sort((a, b) => b.calls - a.calls),
  };
}

/** The newest calls of the window, for a server's activity log. */
export async function mcpActivity(
  servers: readonly McpServerKey[],
  days: number,
  limit = 200,
  now = new Date(),
) {
  assertDays(days);
  const take = Math.min(Math.max(1, Math.floor(limit)), MAX_MCP_ACTIVITY);
  const rows = await callsSince(servers, days, now).limit(take).lean();
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
