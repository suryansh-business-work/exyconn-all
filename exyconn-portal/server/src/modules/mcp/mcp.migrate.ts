import { McpCallModel, McpTokenModel } from './mcp.models';

/**
 * Before there was more than one MCP server, every connection and every call was the CRM's:
 * those stored without an endpoint (or server) learn it, so the CRM's activity log, usage and
 * connections keep them and its connectors keep working. Runs once, as the platform.
 */
export async function assignLegacyMcpToCrm(): Promise<void> {
  await McpTokenModel.updateMany({ endpoint: { $exists: false } }, { $set: { endpoint: 'crm' } });
  await McpCallModel.updateMany({ server: { $exists: false } }, { $set: { server: 'crm' } });
}
