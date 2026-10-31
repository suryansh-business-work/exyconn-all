import { McpEndpoint, McpToolKind } from '@exyconn/shell/graphql/generated';
import type { ApiOperationRow } from '../../../../src/pages/reference/ApiOperationCard';

export const operation = (overrides: Partial<ApiOperationRow> = {}): ApiOperationRow => ({
  __typename: 'ApiOperation',
  name: 'listLeads',
  kind: McpToolKind.Query,
  description: 'Lists the leads.',
  arguments: [
    {
      __typename: 'McpToolArgument',
      name: 'input',
      type: 'TableQueryInput!',
      required: true,
      description: 'Which page to read.',
    },
  ],
  returnType: '[Lead!]!',
  example: 'query { listLeads { id } }',
  ...overrides,
});

export const mcpServer = (endpoint: McpEndpoint, label: string) => ({
  __typename: 'McpServer' as const,
  endpoint,
  label,
  description: `${label} tools`,
  serverUrl: `https://portal-server.exyconn.com/mcp/${endpoint.toLowerCase()}`,
  toolCount: 3,
  queryCount: 2,
  mutationCount: 1,
  connectionCount: 0,
});
