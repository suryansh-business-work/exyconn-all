import { trackerTypeDefs } from '../../tracker/tracker.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * The time tracker as an MCP server: workdays, time entries, activity, expected hours and
 * reports.
 *
 * A Tracker feature added to these typeDefs is a tool the next time the server starts.
 * A NEW Tracker module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const TRACKER_MCP: McpServerSpec = {
  key: 'tracker',
  name: 'exyconn-tracker',
  label: 'Tracker',
  role: ROLES.TRACKER,
  auditModule: 'Tracker (Claude MCP)',
  instructions:
    "Exyconn Tracker: workdays, time entries, activity, expected versus logged hours and reports. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting or editing anyone's time.",
  typeDefs: [trackerTypeDefs],
};
