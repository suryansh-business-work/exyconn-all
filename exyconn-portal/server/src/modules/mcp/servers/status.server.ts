import { statusTypeDefs } from '../../status/status.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * The status page as an MCP server: monitors, incidents, maintenance, subscribers and problem
 * reports.
 *
 * A Status feature added to these typeDefs is a tool the next time the server starts.
 * A NEW Status module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const STATUS_MCP: McpServerSpec = {
  key: 'status',
  name: 'exyconn-status',
  label: 'Status',
  role: ROLES.TECH,
  auditModule: 'Status (Claude MCP)',
  instructions:
    'Exyconn Status, the public status page: monitors, incidents, maintenance windows, subscribers and problem reports. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before publishing an incident or notifying subscribers.',
  typeDefs: [statusTypeDefs],
};
