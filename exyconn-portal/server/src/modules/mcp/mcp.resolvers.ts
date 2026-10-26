import type { GraphQLContext } from '../../middleware/auth';
import { assertAuthenticated } from '../../middleware/roleGuard';
import type { Role } from '../../constants/roles';
import { env } from '../../config/env';
import { badRequest } from '../../utils/errors';
import { recordAudit } from '../audit';
import { endpointTools } from './mcp.catalogue';
import { approveAuthorization, denyAuthorization, describeAuthorization } from './mcp.connect';
import { assertEndpointAccess, serversInReach } from './mcp.access';
import {
  connectionCounts,
  connectionEndpoint,
  mcpActivity,
  mcpConnections,
  mcpUsage,
  revokeMcpConnection,
} from './mcp.usage';
import {
  endpointMeta,
  MCP_ENDPOINT_PATHS,
  serversFor,
  type McpEndpointKey,
  type McpServerKey,
} from './servers';

/** The endpoint as the API spells it (CRM, MARKETING, ALL). */
type EndpointName = Uppercase<McpEndpointKey>;

const keyOf = (name: EndpointName) => name.toLowerCase() as McpEndpointKey;
const nameOf = (key: string) => key.toUpperCase() as EndpointName;
const rolesOf = (ctx: GraphQLContext) => (ctx.user?.roles ?? []) as Role[];

/** The company the caller works in; a platform administrator outside one has none to show. */
function companyOf(ctx: GraphQLContext): string {
  if (!ctx.organizationId) {
    badRequest('Open the portal in a company first.');
  }
  return ctx.organizationId;
}

/** The endpoints a list for this endpoint covers: itself, or every one in reach for ALL. */
function endpointsInReach(endpoint: McpEndpointKey, servers: McpServerKey[]): McpEndpointKey[] {
  return endpoint === 'all' ? [...servers, 'all'] : [endpoint];
}

/** The endpoints the caller may use: each module server of theirs, then ALL when they have one. */
function usableEndpoints(ctx: GraphQLContext): McpEndpointKey[] {
  assertAuthenticated(ctx);
  const servers = serversFor(rolesOf(ctx)).map((spec) => spec.key);
  return servers.length > 0 ? [...servers, 'all'] : [];
}

/** One server as the MCP portal shows it: its address, its tools in brief and its connections. */
function serverInfo(endpoint: McpEndpointKey, roles: Role[], counts: Map<string, number>) {
  const tools = endpointTools(endpoint, roles);
  const meta = endpointMeta(endpoint);
  return {
    endpoint: nameOf(endpoint),
    label: meta.label,
    description: meta.instructions,
    serverUrl: `${env.apiPublicUrl}${MCP_ENDPOINT_PATHS[endpoint]}`,
    toolCount: tools.length,
    queryCount: tools.filter((tool) => tool.kind === 'QUERY').length,
    mutationCount: tools.filter((tool) => tool.kind === 'MUTATION').length,
    connectionCount: counts.get(endpoint) ?? 0,
  };
}

export const mcpResolvers = {
  Query: {
    mcpServers: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const endpoints = usableEndpoints(ctx);
      const counts = ctx.organizationId
        ? await connectionCounts(ctx.organizationId)
        : new Map<string, number>();
      return endpoints.map((endpoint) => serverInfo(endpoint, rolesOf(ctx), counts));
    },
    mcpTools: (_p: unknown, { endpoint }: { endpoint: EndpointName }, ctx: GraphQLContext) => {
      assertEndpointAccess(ctx, keyOf(endpoint));
      return endpointTools(keyOf(endpoint), rolesOf(ctx)).map((tool) => ({
        ...tool,
        server: nameOf(tool.server),
        arguments: tool.args,
      }));
    },
    mcpUsage: (
      _p: unknown,
      { endpoint, days }: { endpoint: EndpointName; days: number },
      ctx: GraphQLContext,
    ) => {
      const servers = serversInReach(ctx, keyOf(endpoint));
      companyOf(ctx);
      return mcpUsage(servers, days);
    },
    mcpActivity: async (
      _p: unknown,
      { endpoint, days, limit }: { endpoint: EndpointName; days: number; limit?: number | null },
      ctx: GraphQLContext,
    ) => {
      const servers = serversInReach(ctx, keyOf(endpoint));
      companyOf(ctx);
      const rows = await mcpActivity(servers, days, limit ?? undefined);
      return rows.map((row) => ({ ...row, server: nameOf(row.server) }));
    },
    mcpConnections: async (
      _p: unknown,
      { endpoint }: { endpoint: EndpointName },
      ctx: GraphQLContext,
    ) => {
      const servers = serversInReach(ctx, keyOf(endpoint));
      const rows = await mcpConnections(companyOf(ctx), endpointsInReach(keyOf(endpoint), servers));
      return rows.map((row) => ({ ...row, endpoint: nameOf(row.endpoint) }));
    },
    mcpAuthorizationRequest: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const request = await describeAuthorization(ctx, id);
      return { ...request, endpoint: nameOf(request.endpoint) };
    },
  },
  Mutation: {
    approveMcpAuthorization: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      approveAuthorization(ctx, id),
    denyMcpAuthorization: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      denyAuthorization(ctx, id),
    revokeMcpConnection: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertAuthenticated(ctx);
      const organizationId = companyOf(ctx);
      const endpoint = await connectionEndpoint(organizationId, id);
      assertEndpointAccess(ctx, endpoint);
      await revokeMcpConnection(organizationId, id);
      const meta = endpointMeta(endpoint);
      await recordAudit(ctx, {
        action: 'DELETE',
        module: meta.auditModule,
        entityId: id,
        entityLabel: 'MCP connection',
        summary: `Signed a Claude (MCP) connection out of ${meta.label}`,
      });
      return true;
    },
  },
};
