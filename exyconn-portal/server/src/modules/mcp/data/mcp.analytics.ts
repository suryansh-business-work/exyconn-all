import { badRequest } from '../../../utils/errors';
import { McpCallModel } from './mcp.models';
import type { McpServerKey } from '../servers';

/** The longest window the usage dashboard, error log and activity log read. */
export const MAX_MCP_DAYS = 180;
/** The most error groups the error log lists. */
const MAX_ERROR_GROUPS = 200;

const DAY_MS = 24 * 60 * 60 * 1000;

interface CallRow {
  at: Date;
  userName: string;
  clientName: string;
  server: string;
  tool: string;
  kind: string;
  ok: boolean;
  errorCode?: string;
  durationMs: number;
}

interface ToolTotals {
  tool: string;
  calls: number;
  failures: number;
  times: number[];
  lastAt: Date;
}

export function assertDays(days: number): void {
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

/** The first moment of the window. */
export function windowStart(days: number, now: Date): Date {
  return new Date(`${windowOf(days, now)[0]}T00:00:00.000Z`);
}

/** The value `share` (0–1) of the way up the sorted times: 0.5 the median, 0.95 the p95. */
function percentile(sorted: readonly number[], share: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil(share * sorted.length) - 1)];
}

const ascending = (values: number[]) => values.sort((a, b) => a - b);

/** Adds one to a counter by key. */
function bump(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

/** A counter as rows, most first. */
function ranked<K extends string>(counts: Map<string, number>, name: K) {
  return [...counts]
    .map(([value, calls]) => ({ [name]: value, calls }) as Record<K, string> & { calls: number })
    .sort((a, b) => b.calls - a.calls);
}

/** One call's share of its tool's totals. */
function addToTool(perTool: Map<string, ToolTotals>, row: CallRow): void {
  const tool = perTool.get(row.tool) ?? {
    tool: row.tool,
    calls: 0,
    failures: 0,
    times: [],
    lastAt: row.at,
  };
  tool.calls += 1;
  tool.failures += row.ok ? 0 : 1;
  tool.times.push(row.durationMs);
  if (row.at > tool.lastAt) tool.lastAt = row.at;
  perTool.set(row.tool, tool);
}

/** Per tool: calls, failures, the average and p95 time, and when it was last called. */
function toolRows(perTool: Map<string, ToolTotals>) {
  return [...perTool.values()]
    .map(({ times, ...tool }) => {
      const sum = times.reduce((total, ms) => total + ms, 0);
      return {
        ...tool,
        averageMs: sum / tool.calls,
        p95Ms: percentile(ascending(times), 0.95),
      };
    })
    .sort((a, b) => b.calls - a.calls);
}

/**
 * The company's calls to these servers over the window: totals, reads and writes, the median
 * and p95 time, a point per day, and the calls by tool, person, client, module and error code.
 */
export async function mcpUsage(servers: readonly McpServerKey[], days: number, now = new Date()) {
  assertDays(days);
  const rows = await McpCallModel.find({
    server: { $in: servers },
    at: { $gte: windowStart(days, now) },
  })
    .select('at userName clientName server tool kind ok errorCode durationMs')
    .lean<CallRow[]>();
  const perDay = new Map(windowOf(days, now).map((day) => [day, { day, calls: 0, failures: 0 }]));
  const perTool = new Map<string, ToolTotals>();
  const perUser = new Map<string, number>();
  const perClient = new Map<string, number>();
  const perServer = new Map<string, number>();
  const perCode = new Map<string, number>();
  for (const row of rows) {
    const day = perDay.get(row.at.toISOString().slice(0, 10));
    if (day) {
      day.calls += 1;
      day.failures += row.ok ? 0 : 1;
    }
    addToTool(perTool, row);
    bump(perUser, row.userName);
    bump(perClient, row.clientName || 'MCP client');
    bump(perServer, row.server);
    if (!row.ok) bump(perCode, row.errorCode || 'UNKNOWN');
  }
  const times = ascending(rows.map((row) => row.durationMs));
  return {
    calls: rows.length,
    failures: rows.filter((row) => !row.ok).length,
    writes: rows.filter((row) => row.kind === 'MUTATION').length,
    people: perUser.size,
    p50Ms: percentile(times, 0.5),
    p95Ms: percentile(times, 0.95),
    days: [...perDay.values()],
    tools: toolRows(perTool),
    users: ranked(perUser, 'userName'),
    clients: ranked(perClient, 'clientName'),
    servers: ranked(perServer, 'server'),
    errorCodes: [...perCode]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * The error log: the window's failed calls grouped by tool, code and message, the most frequent
 * first, each with how many people it hit, when it last happened and the trace id of that call.
 */
export async function mcpErrors(servers: readonly McpServerKey[], days: number, now = new Date()) {
  assertDays(days);
  const groups = await McpCallModel.aggregate<{
    _id: { server: string; tool: string; errorCode: string; error: string };
    count: number;
    firstAt: Date;
    lastAt: Date;
    lastTraceId: string;
    users: string[];
  }>([
    { $match: { server: { $in: servers }, ok: false, at: { $gte: windowStart(days, now) } } },
    { $sort: { at: 1 } },
    {
      $group: {
        _id: { server: '$server', tool: '$tool', errorCode: '$errorCode', error: '$error' },
        count: { $sum: 1 },
        firstAt: { $first: '$at' },
        lastAt: { $last: '$at' },
        lastTraceId: { $last: '$traceId' },
        users: { $addToSet: '$userName' },
      },
    },
    { $sort: { count: -1, lastAt: -1 } },
    { $limit: MAX_ERROR_GROUPS },
  ]);
  return groups.map(({ _id, users, ...group }) => ({
    ..._id,
    errorCode: _id.errorCode || 'UNKNOWN',
    ...group,
    people: users.length,
  }));
}
