import type { McpEndpoint } from '@exyconn/shell/graphql/generated';

/** A server's page (`/mcp/crm`, `/mcp/hr`, `/mcp/all`…), optionally on one tab. */
export function serverPath(endpoint: McpEndpoint, tab?: string): string {
  const base = `/mcp/${endpoint.toLowerCase()}`;
  return tab ? `${base}/${tab}` : base;
}
