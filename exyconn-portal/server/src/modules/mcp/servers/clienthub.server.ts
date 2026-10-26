import { clientHubTypeDefs } from '../../clienthub/clienthub.typeDefs';
import { clientRecordsTypeDefs } from '../../clienthub/records/records.typeDefs';
import { walletGatewayTypeDefs } from '../../clienthub/payments/wallets.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * The Client Hub as an MCP server, from the company's side: client contacts and their hub
 * access, what is shared with each client, their communications, and the payment gateways.
 *
 * A Client Hub feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Client Hub module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const CLIENTHUB_MCP: McpServerSpec = {
  key: 'clienthub',
  name: 'exyconn-clienthub',
  label: 'Client Hub',
  role: ROLES.ADMIN,
  auditModule: 'Client Hub (Claude MCP)',
  instructions:
    "Exyconn Client Hub, from the company's side: client contacts and their hub access, shared items and links, client communications and the payment gateways. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting, sending or sharing anything with a client.",
  typeDefs: [clientHubTypeDefs, clientRecordsTypeDefs, walletGatewayTypeDefs],
};
