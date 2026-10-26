import type { ApolloServerPlugin } from '@apollo/server';
import type { GraphQLSchema } from 'graphql';
import type { GraphQLContext } from '../../../middleware/auth';
import type { Role } from '../../../constants/roles';
import { declaredFields, moduleTools, type DeclaredFields, type McpTool } from './mcp.tools';
import { MCP_SERVERS, serversOf, type McpEndpointKey, type McpServerKey } from '../servers';

/** A tool together with the module server it belongs to. */
export interface McpServerTool extends McpTool {
  server: McpServerKey;
}

/** Which fields each module server declares, by server. */
export type DeclaredByServer = Partial<Record<McpServerKey, DeclaredFields>>;

let schema: GraphQLSchema | null = null;
let tools = new Map<McpServerKey, McpServerTool[]>();

/** Keeps the schema Apollo builds, and every module's tools made from it. */
export const mcpSchemaPlugin: ApolloServerPlugin<GraphQLContext> = {
  serverWillStart: (service) => {
    useSchema(service.schema);
    return Promise.resolve();
  },
};

const declaredOfServers = (): DeclaredByServer =>
  Object.fromEntries(MCP_SERVERS.map((spec) => [spec.key, declaredFields(spec.typeDefs)]));

const NOTHING: DeclaredFields = { query: new Set(), mutation: new Set() };

/**
 * Sets the schema tools run against (Apollo's at boot, offering each module's own fields; a
 * test's own) and builds every module server's tools from it.
 */
export function useSchema(next: GraphQLSchema, declared = declaredOfServers()): void {
  schema = next;
  tools = new Map(
    MCP_SERVERS.map((spec) => [
      spec.key,
      moduleTools(next, declared[spec.key] ?? NOTHING, spec.label).map((tool) => ({
        ...tool,
        server: spec.key,
      })),
    ]),
  );
}

/** The live schema; throws before the server has started. */
export function liveSchema(): GraphQLSchema {
  if (!schema) {
    throw new Error('The GraphQL schema is not ready yet');
  }
  return schema;
}

/** One module server's tools, by name order. */
export function serverTools(key: McpServerKey): readonly McpServerTool[] {
  return tools.get(key) ?? [];
}

/**
 * The tools an endpoint offers a person with these roles: its own module's, or for the global
 * endpoint every module's they may use. A field two modules both declare is offered once.
 */
export function endpointTools(endpoint: McpEndpointKey, roles: readonly Role[]): McpServerTool[] {
  const byName = new Map<string, McpServerTool>();
  for (const spec of serversOf(endpoint, roles)) {
    for (const tool of serverTools(spec.key)) {
      if (!byName.has(tool.name)) byName.set(tool.name, tool);
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** One tool of an endpoint by name, or undefined. */
export function endpointTool(
  endpoint: McpEndpointKey,
  roles: readonly Role[],
  name: string,
): McpServerTool | undefined {
  return endpointTools(endpoint, roles).find((tool) => tool.name === name);
}
