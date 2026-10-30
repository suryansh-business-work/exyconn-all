import { McpCallModel } from '../data/mcp.models';
import type { McpSettings } from '../data/mcp.settings';
import type { McpServerTool } from './mcp.catalogue';
import type { McpCaller } from './mcp.server';

const HOUR_MS = 60 * 60 * 1000;

/** Why a call was refused before it ran, as the activity log and Claude read it. */
export interface McpRefusal {
  code: 'TOOL_DISABLED' | 'READ_ONLY' | 'RATE_LIMITED';
  message: string;
}

/** Whether a change is off for this caller: a read-only connection, or a read-only server. */
function writesOff(tool: McpServerTool, caller: McpCaller, settings: McpSettings): boolean {
  return (
    tool.kind === 'MUTATION' && (caller.readOnly || settings.readOnlyServers.includes(tool.server))
  );
}

/** Whether a tool is offered to this caller at all, given the company's settings. */
export function isOffered(tool: McpServerTool, caller: McpCaller, settings: McpSettings): boolean {
  return !settings.disabledTools.includes(tool.name) && !writesOff(tool, caller, settings);
}

/** The person's (or one connection's) calls in the last hour; refused ones do not count. */
function recentCalls(caller: McpCaller, extra: Record<string, unknown>): Promise<number> {
  return McpCallModel.countDocuments({
    userId: caller.ctx.user?.id ?? '',
    at: { $gte: new Date(Date.now() - HOUR_MS) },
    errorCode: { $nin: ['RATE_LIMITED', 'TOOL_DISABLED', 'READ_ONLY'] },
    ...extra,
  });
}

/** Each limit the company set, with the calls it counts and how it reads when reached. */
function limitsOf(tool: McpServerTool, caller: McpCaller, settings: McpSettings) {
  return [
    { limit: settings.callsPerHourPerPerson, filter: {}, what: 'calls an hour for you' },
    {
      limit: settings.callsPerHourPerConnection,
      filter: { clientId: caller.clientId },
      what: 'calls an hour for this connection',
    },
    {
      limit: tool.kind === 'MUTATION' ? settings.writesPerHourPerPerson : 0,
      filter: { kind: 'MUTATION' },
      what: 'changes an hour for you',
    },
  ].filter((rule) => rule.limit > 0);
}

/**
 * Why this call may not run, or null when it may: the tool is switched off, a change on a
 * read-only connection or server, or a rate limit the company set is reached.
 */
export async function refusalOf(
  tool: McpServerTool,
  caller: McpCaller,
  settings: McpSettings,
): Promise<McpRefusal | null> {
  if (settings.disabledTools.includes(tool.name)) {
    return { code: 'TOOL_DISABLED', message: `${tool.name} is switched off for this company.` };
  }
  if (writesOff(tool, caller, settings)) {
    return { code: 'READ_ONLY', message: 'This connection may only read; it cannot make changes.' };
  }
  for (const rule of limitsOf(tool, caller, settings)) {
    if ((await recentCalls(caller, rule.filter)) >= rule.limit) {
      return {
        code: 'RATE_LIMITED',
        message: `The company's limit of ${rule.limit} ${rule.what} is reached. Try again later.`,
      };
    }
  }
  return null;
}
