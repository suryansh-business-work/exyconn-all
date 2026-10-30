import type { McpSettingsQuery } from '@exyconn/shell/graphql/generated';

/** The company's saved MCP settings, as the form starts from them (codegen type). */
export type McpSettingsFormValues = McpSettingsQuery['mcpSettings'];
