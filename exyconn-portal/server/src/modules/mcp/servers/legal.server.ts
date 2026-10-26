import { legalTypeDefs } from '../../legal/legal.typeDefs';
import { legalGroupTypeDefs } from '../../legal/legal-group.typeDefs';
import { policyTypeDefs } from '../../legal/policy.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * Legal as an MCP server: legal documents and their groups, and policies.
 *
 * A Legal feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Legal module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const LEGAL_MCP: McpServerSpec = {
  key: 'legal',
  name: 'exyconn-legal',
  label: 'Legal',
  role: ROLES.LEGAL,
  auditModule: 'Legal (Claude MCP)',
  instructions:
    'Exyconn Legal: legal documents and their groups, and company policies. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting or publishing anything.',
  typeDefs: [legalTypeDefs, legalGroupTypeDefs, policyTypeDefs],
};
