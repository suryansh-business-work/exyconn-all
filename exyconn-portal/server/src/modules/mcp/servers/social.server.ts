import { socialTypeDefs } from '../../social/social.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * Social, the internal employee feed, as an MCP server: posts, comments, reactions and profiles.
 *
 * A Social feature added to these typeDefs is a tool the next time the server starts.
 * A NEW Social module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const SOCIAL_MCP: McpServerSpec = {
  key: 'social',
  name: 'exyconn-social',
  label: 'Social',
  role: ROLES.EMPLOYEE,
  auditModule: 'Social (Claude MCP)',
  instructions:
    "Exyconn Social, the company's internal feed: posts, comments, reactions and profiles. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before posting, commenting or deleting anything.",
  typeDefs: [socialTypeDefs],
};
