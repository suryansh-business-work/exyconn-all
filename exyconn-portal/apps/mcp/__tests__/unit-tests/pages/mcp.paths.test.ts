import { describe, expect, it } from 'vitest';
import { McpEndpoint } from '@exyconn/shell/graphql/generated';
import { serverPath } from '../../../src/pages/mcp.paths';

describe('MCP paths', () => {
  it('writes a server’s page, on a tab or not', () => {
    expect(serverPath(McpEndpoint.Marketing)).toBe('/mcp/marketing');
    expect(serverPath(McpEndpoint.All, 'tools')).toBe('/mcp/all/tools');
  });
});
