import { supportTypeDefs } from '../../support/support.typeDefs';
import { supportLibraryTypeDefs } from '../../support/support.library.typeDefs';
import { supportOmnichannelTypeDefs } from '../../support/support.omnichannel.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * Support as an MCP server: support tickets, the support library, the conversations tickets
 * link to (website chat, WhatsApp), AI suggested replies and customer satisfaction.
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
    'Exyconn Support: support tickets from every channel (portal, email, website chat, WhatsApp), their replies, AI suggested replies, customer satisfaction and the support library. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before replying to a customer or deleting anything.',
  typeDefs: [supportTypeDefs, supportLibraryTypeDefs, supportOmnichannelTypeDefs],
};
