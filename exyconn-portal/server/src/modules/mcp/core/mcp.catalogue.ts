import type { ApolloServerPlugin } from '@apollo/server';
import { parse, validate, type DocumentNode, type GraphQLSchema } from 'graphql';
import type { GraphQLContext } from '../../../middleware/auth';
import type { Role } from '../../../constants/roles';
import { logger } from '../../../utils/logger';
import { declaredFields, moduleTools, type DeclaredFields, type McpTool } from './mcp.tools';
import { MCP_SERVERS, serversOf, type McpEndpointKey, type McpServerKey } from '../servers';

/** A tool together with the module server it belongs to, its operation parsed and validated. */
export interface McpServerTool extends McpTool {
  server: McpServerKey;
  operation: DocumentNode;
}

/** An endpoint's tools for one set of roles, in name order and by name. */
interface EndpointCatalogue {
  list: McpServerTool[];
  byName: Map<string, McpServerTool>;
}

/** Which fields each module server declares, by server. */
export type DeclaredByServer = Partial<Record<McpServerKey, DeclaredFields>>;

let schema: GraphQLSchema | null = null;
let tools = new Map<McpServerKey, McpServerTool[]>();
let catalogues = new Map<string, EndpointCatalogue>();

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
 * A module's tool with its operation parsed and checked against the schema once, here, rather
 * than on every call. One the schema refuses is left out and logged, never offered.
 */
function compiled(next: GraphQLSchema, tool: McpTool, server: McpServerKey) {
  const operation = parse(tool.document);
  const errors = validate(next, operation);
  if (errors.length > 0) {
    logger.warn({ tool: tool.name, server, error: errors[0].message }, 'MCP tool left out');
    return [];
  }
  return [{ ...tool, server, operation }];
}

/**
 * Sets the schema tools run against (Apollo's at boot, offering each module's own fields; a
 * test's own) and builds every module server's tools from it.
 */
export function useSchema(next: GraphQLSchema, declared = declaredOfServers()): void {
  schema = next;
  catalogues = new Map();
  tools = new Map(
    MCP_SERVERS.map((spec) => [
      spec.key,
      moduleTools(next, declared[spec.key] ?? NOTHING, spec.label).flatMap((tool) =>
        compiled(next, tool, spec.key),
      ),
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
  return catalogueOf(endpoint, roles).list;
}

/** One tool of an endpoint by name, or undefined. */
export function endpointTool(
  endpoint: McpEndpointKey,
  roles: readonly Role[],
  name: string,
): McpServerTool | undefined {
  return catalogueOf(endpoint, roles).byName.get(name);
}

/**
 * An endpoint's tools for a set of roles, built once per schema: `/mcp/all` holds well over a
 * thousand tools, and every list and call of every connection reads them.
 */
function catalogueOf(endpoint: McpEndpointKey, roles: readonly Role[]): EndpointCatalogue {
  const key = `${endpoint}|${[...roles].sort((a, b) => a.localeCompare(b)).join(',')}`;
  const cached = catalogues.get(key);
  if (cached) return cached;
  const byName = new Map<string, McpServerTool>();
  for (const spec of serversOf(endpoint, roles)) {
    for (const tool of serverTools(spec.key)) {
      if (!byName.has(tool.name)) byName.set(tool.name, tool);
    }
  }
  const list = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  const catalogue = { list, byName };
  catalogues.set(key, catalogue);
  return catalogue;
}
