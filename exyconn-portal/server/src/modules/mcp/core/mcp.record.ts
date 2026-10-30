import type { GraphQLError } from 'graphql';
import { logger } from '../../../utils/logger';
import { recordAudit, type AuditAction } from '../../audit';
import { McpCallModel } from '../data/mcp.models';
import { endpointMeta } from '../servers';
import type { McpServerTool } from './mcp.catalogue';
import type { McpCaller } from './mcp.server';

/** How one call went, as the activity log, the error log and the usage dashboards keep it. */
export interface McpCallOutcome {
  traceId: string;
  args: Record<string, unknown>;
  ms: number;
  /** Empty when the call worked. */
  error: string;
  errorCode: string;
  answerChars: number;
  truncated: boolean;
}

/** Codes a person or Claude can act on (wrong input, no permission, missing record). */
const EXPECTED_CODES = new Set([
  'BAD_USER_INPUT',
  'FORBIDDEN',
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'INVALID_ARGUMENTS',
  'TOOL_DISABLED',
  'READ_ONLY',
  'RATE_LIMITED',
]);

/**
 * What kind of failure a call's first error is: its GraphQL code; INVALID_ARGUMENTS when the
 * arguments did not fit the tool (GraphQL refused them before any resolver ran); INTERNAL for
 * anything a resolver threw without a code.
 */
export function errorCodeOf(errors: readonly GraphQLError[]): string {
  const first = errors[0];
  if (!first) return '';
  const code = first.extensions?.code;
  if (typeof code === 'string') return code;
  return first.originalError ? 'INTERNAL' : 'INVALID_ARGUMENTS';
}

/** The audit action a change reads as, from the tool's name. */
export function auditActionOf(tool: string): AuditAction {
  if (/^(delete|remove|archive)/i.test(tool)) return 'DELETE';
  if (/^(create|add|import|convert|send|start|book|log|publish|queue)/i.test(tool)) return 'CREATE';
  return 'UPDATE';
}

/**
 * Keeps the call for the activity log, the error log and the usage dashboard, files a change in
 * the audit log, and reports an unexpected failure to Tech > Logs with its trace id. Never fails
 * the call: a log that cannot be written is itself logged.
 */
export async function recordCall(
  caller: McpCaller,
  tool: McpServerTool,
  outcome: McpCallOutcome,
): Promise<void> {
  const ok = outcome.error === '';
  const where = { traceId: outcome.traceId, tool: tool.name, server: tool.server };
  if (!ok && !EXPECTED_CODES.has(outcome.errorCode)) {
    logger.error(
      { ...where, organizationId: caller.organizationId, code: outcome.errorCode },
      `MCP tool failed: ${outcome.error.slice(0, 300)}`,
    );
  }
  try {
    await McpCallModel.create({
      server: tool.server,
      endpoint: caller.endpoint,
      userId: caller.ctx.user?.id ?? '',
      userName: caller.userName,
      clientName: caller.clientName,
      clientId: caller.clientId,
      tool: tool.name,
      kind: tool.kind,
      ok,
      error: outcome.error.slice(0, 500),
      errorCode: outcome.errorCode,
      durationMs: outcome.ms,
      traceId: outcome.traceId,
      argNames: Object.keys(outcome.args).slice(0, 50),
      answerChars: outcome.answerChars,
      truncated: outcome.truncated,
      at: new Date(),
    });
    if (ok && tool.kind === 'MUTATION') {
      await recordAudit(caller.ctx, {
        action: auditActionOf(tool.name),
        module: endpointMeta(tool.server).auditModule,
        entityLabel: tool.name,
        summary: `Claude (MCP) ran ${tool.name} for ${caller.userName} (trace ${outcome.traceId})`,
      });
    }
  } catch (err) {
    logger.warn({ err, ...where }, 'Could not log an MCP tool call');
  }
}
