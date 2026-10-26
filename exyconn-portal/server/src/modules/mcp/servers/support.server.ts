import { supportTypeDefs } from '../../support/support.typeDefs';
import { supportLibraryTypeDefs } from '../../support/support.library.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * Support as an MCP server: support tickets and the support library.
 *
 * A Support feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Support module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const SUPPORT_MCP: McpServerSpec = {
  key: 'support',
  name: 'exyconn-support',
  label: 'Support',
  role: ROLES.SUPPORT,
  auditModule: 'Support (Claude MCP)',
  instructions:
    'Exyconn Support: support tickets, their replies and the support library. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before replying to a customer or deleting anything.',
  typeDefs: [supportTypeDefs, supportLibraryTypeDefs],
};
