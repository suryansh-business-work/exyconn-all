import type { GraphQLContext } from '../../middleware/auth';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { env } from '../../config/env';
import { badRequest } from '../../utils/errors';
import { recordAudit } from '../audit';
import { mcpTools } from './mcp.crm';
import {
  approveAuthorization,
  denyAuthorization,
  describeAuthorization,
  MCP_AUDIT_MODULE,
} from './mcp.connect';
import { MCP_PATH } from './mcp.router';
import { mcpActivity, mcpConnections, mcpUsage, revokeMcpConnection } from './mcp.usage';

/** Everything here is the CRM's: its own role, in the caller's company. */
const crmUser = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.CRM]);

/** The company the caller works in; a platform administrator outside one has none to show. */
function companyOf(ctx: GraphQLContext): string {
  crmUser(ctx);
  if (!ctx.organizationId) {
    badRequest('Open the CRM in a company first.');
  }
  return ctx.organizationId;
}

export const mcpResolvers = {
  Query: {
    mcpOverview: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      crmUser(ctx);
      const tools = mcpTools();
      return {
        serverUrl: `${env.apiPublicUrl}${MCP_PATH}`,
        toolCount: tools.length,
        queryCount: tools.filter((tool) => tool.kind === 'QUERY').length,
        mutationCount: tools.filter((tool) => tool.kind === 'MUTATION').length,
      };
    },
    mcpTools: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      crmUser(ctx);
      return mcpTools().map((tool) => ({ ...tool, arguments: tool.args }));
    },
    mcpUsage: (_p: unknown, { days }: { days: number }, ctx: GraphQLContext) => {
      companyOf(ctx);
      return mcpUsage(days);
    },
    mcpActivity: (
      _p: unknown,
      { days, limit }: { days: number; limit?: number | null },
      ctx: GraphQLContext,
    ) => {
      companyOf(ctx);
      return mcpActivity(days, limit ?? undefined);
    },
    mcpConnections: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      mcpConnections(companyOf(ctx)),
    mcpAuthorizationRequest: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      describeAuthorization(ctx, id),
  },
  Mutation: {
    approveMcpAuthorization: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      approveAuthorization(ctx, id),
    denyMcpAuthorization: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      denyAuthorization(ctx, id),
    revokeMcpConnection: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const organizationId = companyOf(ctx);
      await revokeMcpConnection(organizationId, id);
      await recordAudit(ctx, {
        action: 'DELETE',
        module: MCP_AUDIT_MODULE,
        entityId: id,
        entityLabel: 'MCP connection',
        summary: 'Signed a Claude (MCP) connection out of the CRM',
      });
      return true;
    },
  },
};
