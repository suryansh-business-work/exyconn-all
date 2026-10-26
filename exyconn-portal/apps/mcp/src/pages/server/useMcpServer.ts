import { useMcpServersQuery, type McpEndpoint } from '@exyconn/shell/graphql/generated';

/**
 * One server the person may use, from the servers list every MCP page shares (one request,
 * cached). `server` is undefined while loading, and when the person may not use it.
 */
export function useMcpServer(endpoint: McpEndpoint) {
  const { data, loading, error } = useMcpServersQuery();
  const server = data?.mcpServers.find((item) => item.endpoint === endpoint);
  return { server, loading, error, loaded: data !== undefined };
}
