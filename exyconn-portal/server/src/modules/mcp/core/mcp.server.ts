import { randomUUID } from 'node:crypto';
import { execute } from 'graphql';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type { GraphQLContext } from '../../../middleware/auth';
import type { Role } from '../../../constants/roles';
import { runAsPlatform, runForOrganization } from '../../../lib/tenant';
import { logger } from '../../../utils/logger';
import { UserModel } from '../../admin/user.model';
import { endpointTool, endpointTools, liveSchema, type McpServerTool } from './mcp.catalogue';
import { answerOf } from './mcp.answer';
import { isOffered, refusalOf } from './mcp.policy';
import { mcpSettings } from '../data/mcp.settings';
import { auditActionOf, errorCodeOf, recordCall } from './mcp.record';
import { humanize } from './mcp.describe';
import { endpointMeta, type McpEndpointKey } from '../servers';

/** Who a tool call runs as: the person and company the connection was allowed for. */
export interface McpCaller {
  ctx: GraphQLContext;
  organizationId: string;
  userName: string;
  clientName: string;
  /** The endpoint the connection was allowed for; its token is only good there. */
  endpoint: McpEndpointKey;
  /** The client the connection belongs to; with the person, one connection for rate limits. */
  clientId: string;
  /** Allowed for reading only: no change is offered or run. */
  readOnly: boolean;
}

/** What a verified access token carries (see mcp.oauth.ts). */
export interface McpTokenExtra {
  userId: string;
  organizationId: string;
  clientName: string;
  endpoint: McpEndpointKey;
  clientId: string;
  readOnly: boolean;
}

/**
 * The person behind a connection, read fresh — a deactivated, blocked or signed-out (token
 * version raised) account can no longer act through Claude. Null when they cannot.
 */
export async function callerOf(auth: AuthInfo): Promise<McpCaller | null> {
  const extra = auth.extra as unknown as McpTokenExtra;
  const user = await runAsPlatform(() =>
    UserModel.findById(extra.userId)
      .select('name email roles isActive isBlocked tokenVersion')
      .lean(),
  );
  if (!user?.isActive || user.isBlocked) {
    return null;
  }
  return {
    ctx: {
      user: {
        id: extra.userId,
        email: user.email,
        roles: user.roles,
        organizationId: extra.organizationId,
        tv: user.tokenVersion ?? 0,
      },
      organizationId: extra.organizationId,
      userAgent: `${extra.clientName || 'Claude'} (MCP)`,
    },
    organizationId: extra.organizationId,
    userName: user.name,
    clientName: extra.clientName,
    endpoint: extra.endpoint,
    clientId: extra.clientId,
    readOnly: extra.readOnly,
  };
}

/** The roles a caller holds. */
export const rolesOf = (caller: McpCaller): Role[] => (caller.ctx.user?.roles ?? []) as Role[];

export { auditActionOf } from './mcp.record';

/** A text answer, carrying the call's trace id so the person can find it in the activity log. */
const text = (value: string, traceId: string, isError = false): CallToolResult => ({
  content: [{ type: 'text', text: value }],
  _meta: { traceId },
  ...(isError ? { isError: true } : {}),
});

/** The tool's answer, or the errors it ended with, from running its operation. */
async function execution(tool: McpServerTool, args: Record<string, unknown>, caller: McpCaller) {
  try {
    const result = await execute({
      schema: liveSchema(),
      document: tool.operation,
      variableValues: args,
      contextValue: caller.ctx,
    });
    const errors = result.errors ?? [];
    return {
      data: result.data?.[tool.name],
      error: errors.map((error) => error.message).join('\n'),
      errorCode: errorCodeOf(errors),
    };
  } catch (err) {
    return {
      data: undefined,
      error: err instanceof Error ? err.message : 'The tool stopped unexpectedly.',
      errorCode: 'INTERNAL',
    };
  }
}

/**
 * Runs one tool as its caller: the module's operation through the live schema, inside their
 * company, with the context a portal request of theirs would have — so every guard and
 * permission check applies exactly as it does in the portal — unless the company's MCP settings
 * refuse it first (a switched-off tool, a change on a read-only connection or server, a rate
 * limit). Every call, run, failed or refused, is recorded under a trace id Claude is handed.
 */
export async function runTool(
  tool: McpServerTool,
  args: Record<string, unknown>,
  caller: McpCaller,
): Promise<CallToolResult> {
  const started = Date.now();
  const traceId = randomUUID();
  return runForOrganization(caller.organizationId, async () => {
    const refusal = await refusalOf(tool, caller, await mcpSettings());
    const { data, error, errorCode } = refusal
      ? { data: undefined, error: refusal.message, errorCode: refusal.code }
      : await execution(tool, args, caller);
    const answer = error ? null : answerOf(data);
    await recordCall(caller, tool, {
      traceId,
      args,
      ms: Date.now() - started,
      error,
      errorCode,
      answerChars: answer?.text.length ?? 0,
      truncated: answer?.truncated ?? false,
    });
    if (answer) {
      return text(answer.text, traceId);
    }
    return text(`${error}\n\n(${errorCode}; trace ${traceId})`, traceId, true);
  });
}

/**
 * How a tool behaves, for the client's approval prompts: its name as people read it, whether it
 * only reads, whether it removes something, and whether running it twice changes nothing more.
 */
function annotationsOf(tool: McpServerTool) {
  const readOnly = tool.kind === 'QUERY';
  const destructive = auditActionOf(tool.name) === 'DELETE';
  return {
    title: humanize(tool.name).replace(/^./, (first) => first.toUpperCase()),
    readOnlyHint: readOnly,
    destructiveHint: destructive,
    idempotentHint: readOnly || destructive,
  };
}

/** An MCP server for one request, offering the caller every tool of their endpoint. */
export function createMcpServer(caller: McpCaller): Server {
  const meta = endpointMeta(caller.endpoint);
  const roles = rolesOf(caller);
  const server = new Server(
    { name: meta.name, version: '1.0.0' },
    { capabilities: { tools: {} }, instructions: meta.instructions },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const settings = await runForOrganization(caller.organizationId, mcpSettings);
    return {
      tools: endpointTools(caller.endpoint, roles)
        .filter((tool) => isOffered(tool, caller, settings))
        .map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema as { type: 'object' },
          annotations: annotationsOf(tool),
        })),
    };
  });
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = endpointTool(caller.endpoint, roles, request.params.name);
    if (!tool) {
      logger.warn(
        { tool: request.params.name, endpoint: caller.endpoint, client: caller.clientName },
        'MCP call to an unknown tool',
      );
      return {
        content: [
          { type: 'text', text: `There is no ${meta.label} tool named ${request.params.name}.` },
        ],
        isError: true,
      };
    }
    return runTool(tool, request.params.arguments ?? {}, caller);
  });
  return server;
}
