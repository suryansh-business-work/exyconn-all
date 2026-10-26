import { execute, parse, validate } from 'graphql';
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
import { recordAudit, type AuditAction } from '../../audit';
import { endpointTool, endpointTools, liveSchema, type McpServerTool } from './mcp.catalogue';
import { McpCallModel } from '../data/mcp.models';
import { endpointMeta, type McpEndpointKey } from '../servers';

/** The longest answer handed back to Claude, in characters; longer ones are cut and say so. */
const MAX_ANSWER_CHARS = 60_000;

/** Who a tool call runs as: the person and company the connection was allowed for. */
export interface McpCaller {
  ctx: GraphQLContext;
  organizationId: string;
  userName: string;
  clientName: string;
  /** The endpoint the connection was allowed for; its token is only good there. */
  endpoint: McpEndpointKey;
}

/** What a verified access token carries (see mcp.oauth.ts). */
export interface McpTokenExtra {
  userId: string;
  organizationId: string;
  clientName: string;
  endpoint: McpEndpointKey;
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
  };
}

/** The roles a caller holds. */
export const rolesOf = (caller: McpCaller): Role[] => (caller.ctx.user?.roles ?? []) as Role[];

/** The audit action a change reads as, from the tool's name. */
export function auditActionOf(tool: string): AuditAction {
  if (/^(delete|remove|archive)/i.test(tool)) return 'DELETE';
  if (/^(create|add|import|convert|send|start|book|log|publish|queue)/i.test(tool)) return 'CREATE';
  return 'UPDATE';
}

const text = (value: string, isError = false): CallToolResult => ({
  content: [{ type: 'text', text: value }],
  ...(isError ? { isError: true } : {}),
});

/** The answer as JSON, cut to what Claude can take in one turn. */
function answerOf(value: unknown): string {
  const json = JSON.stringify(value ?? null, null, 2);
  if (json.length <= MAX_ANSWER_CHARS) {
    return json;
  }
  return `${json.slice(0, MAX_ANSWER_CHARS)}\n… (cut: ask for fewer rows or a narrower filter)`;
}

/** Keeps the call for the activity log and the usage dashboard; never fails the call. */
async function logCall(
  caller: McpCaller,
  tool: McpServerTool,
  ok: boolean,
  error: string,
  ms: number,
) {
  try {
    await McpCallModel.create({
      server: tool.server,
      userId: caller.ctx.user?.id ?? '',
      userName: caller.userName,
      clientName: caller.clientName,
      tool: tool.name,
      kind: tool.kind,
      ok,
      error: error.slice(0, 500),
      durationMs: ms,
      at: new Date(),
    });
    if (ok && tool.kind === 'MUTATION') {
      await recordAudit(caller.ctx, {
        action: auditActionOf(tool.name),
        module: endpointMeta(tool.server).auditModule,
        entityLabel: tool.name,
        summary: `Claude (MCP) ran ${tool.name} for ${caller.userName}`,
      });
    }
  } catch (err) {
    logger.warn({ err, tool: tool.name }, 'Could not log an MCP tool call');
  }
}

/**
 * Runs one tool as its caller: the module's operation through the live schema, inside their
 * company, with the context a portal request of theirs would have — so every guard and
 * permission check applies exactly as it does in the portal.
 */
export async function runTool(
  tool: McpServerTool,
  args: Record<string, unknown>,
  caller: McpCaller,
): Promise<CallToolResult> {
  const started = Date.now();
  return runForOrganization(caller.organizationId, async () => {
    const schema = liveSchema();
    const document = parse(tool.document);
    const invalid = validate(schema, document);
    const result =
      invalid.length > 0
        ? { errors: invalid }
        : await execute({ schema, document, variableValues: args, contextValue: caller.ctx });
    const errors = (result.errors ?? []).map((error) => error.message).join('\n');
    await logCall(caller, tool, errors === '', errors, Date.now() - started);
    if (errors) {
      return text(errors, true);
    }
    return text(answerOf((result as { data?: Record<string, unknown> }).data?.[tool.name]));
  });
}

/** An MCP server for one request, offering the caller every tool of their endpoint. */
export function createMcpServer(caller: McpCaller): Server {
  const meta = endpointMeta(caller.endpoint);
  const roles = rolesOf(caller);
  const server = new Server(
    { name: meta.name, version: '1.0.0' },
    { capabilities: { tools: {} }, instructions: meta.instructions },
  );
  server.setRequestHandler(ListToolsRequestSchema, () =>
    Promise.resolve({
      tools: endpointTools(caller.endpoint, roles).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as { type: 'object' },
        annotations: {
          readOnlyHint: tool.kind === 'QUERY',
          destructiveHint: auditActionOf(tool.name) === 'DELETE',
        },
      })),
    }),
  );
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = endpointTool(caller.endpoint, roles, request.params.name);
    if (!tool) {
      return text(`There is no ${meta.label} tool named ${request.params.name}.`, true);
    }
    return runTool(tool, request.params.arguments ?? {}, caller);
  });
  return server;
}
