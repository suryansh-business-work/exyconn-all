import { complianceTypeDefs } from '../../compliance/compliance.typeDefs';
import { complianceAuditsTypeDefs } from '../../compliance/compliance.audits.typeDefs';
import { complianceReviewsTypeDefs } from '../../compliance/compliance.reviews.typeDefs';
import { complianceDashboardTypeDefs } from '../../compliance/compliance.dashboard.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * Compliance as an MCP server: the ISO registers (9001, 27001, 45001, 14001), audits,
 * management reviews and the dashboard.
 *
 * A Compliance feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Compliance module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const COMPLIANCE_MCP: McpServerSpec = {
  key: 'compliance',
  name: 'exyconn-compliance',
  label: 'Compliance',
  role: ROLES.COMPLIANCE,
  auditModule: 'Compliance (Claude MCP)',
  instructions:
    'Exyconn Compliance: the ISO registers (9001, 27001, 45001 and 14001), audits, management reviews and the compliance dashboard. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting anything.',
  typeDefs: [
    complianceTypeDefs,
    complianceAuditsTypeDefs,
    complianceReviewsTypeDefs,
    complianceDashboardTypeDefs,
  ],
};
