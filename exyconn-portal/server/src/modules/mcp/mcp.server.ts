import { execute, parse, validate } from 'graphql';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type { GraphQLContext } from '../../middleware/auth';
import { runAsPlatform, runForOrganization } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { UserModel } from '../admin/user.model';
import { recordAudit, type AuditAction } from '../audit';
import { liveSchema, mcpTool, mcpTools } from './mcp.crm';
import type { McpTool } from './mcp.tools';
import { MCP_AUDIT_MODULE } from './mcp.connect';
import { McpCallModel } from './mcp.models';

/** The longest answer handed back to Claude, in characters; longer ones are cut and say so. */
const MAX_ANSWER_CHARS = 60_000;

/** Who a tool call runs as: the person and company the connection was allowed for. */
export interface McpCaller {
  ctx: GraphQLContext;
  organizationId: string;
  userName: string;
  clientName: string;
}

/**
 * The person behind a connection, read fresh — a deactivated, blocked or signed-out (token
 * version raised) account can no longer act through Claude. Null when they cannot.
 */
export async function callerOf(auth: AuthInfo): Promise<McpCaller | null> {
  const extra = auth.extra as { userId: string; organizationId: string; clientName: string };
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
  };
}

/** The audit action a CRM change reads as, from the tool's name. */
export function auditActionOf(tool: string): AuditAction {
  if (/^(delete|remove|archive)/i.test(tool)) return 'DELETE';
  if (/^(create|add|import|convert|send|start|book|log)/i.test(tool)) return 'CREATE';
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

/** Keeps the call for the CRM activity log and the usage dashboard; never fails the call. */
async function logCall(caller: McpCaller, tool: McpTool, ok: boolean, error: string, ms: number) {
  try {
    await McpCallModel.create({
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
        module: MCP_AUDIT_MODULE,
        entityLabel: tool.name,
        summary: `Claude (MCP) ran ${tool.name} for ${caller.userName}`,
      });
    }
  } catch (err) {
    logger.warn({ err, tool: tool.name }, 'Could not log an MCP tool call');
  }
}

/**
 * Runs one tool as its caller: the CRM operation through the live schema, inside their company,
 * with the context a portal request of theirs would have — so every guard and permission check
 * applies exactly as it does in the portal.
 */
export async function runTool(
  tool: McpTool,
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

/** An MCP server for one request, offering every CRM tool to the caller. */
export function createMcpServer(caller: McpCaller): Server {
  const server = new Server(
    { name: 'exyconn-crm', version: '1.0.0' },
    {
      capabilities: { tools: {} },
      instructions:
        'Exyconn CRM: leads, companies, contacts, deals, activities, meetings, mail, cold emails, the lead generator, the email verifier and the website scraper. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting or sending anything.',
    },
  );
  server.setRequestHandler(ListToolsRequestSchema, () =>
    Promise.resolve({
      tools: mcpTools().map((tool) => ({
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
    const tool = mcpTool(request.params.name);
    if (!tool) {
      return text(`There is no CRM tool named ${request.params.name}.`, true);
    }
    return runTool(tool, request.params.arguments ?? {}, caller);
  });
  return server;
}
