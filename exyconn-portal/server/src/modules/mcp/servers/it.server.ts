import { itRegistersTypeDefs } from '../../itsm/registers.typeDefs';
import { itWorkflowTypeDefs } from '../../itsm/workflow.typeDefs';
import { itInsightsTypeDefs } from '../../itsm/insights.typeDefs';
import { assetsTypeDefs } from '../../assets/assets.typeDefs';
import { licencesTypeDefs } from '../../assets/licences.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * IT as an MCP server: the IT service registers and workflows, insights, assets and licences.
 *
 * An IT feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW IT module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const IT_MCP: McpServerSpec = {
  key: 'it',
  name: 'exyconn-it',
  label: 'IT',
  role: ROLES.IT,
  auditModule: 'IT (Claude MCP)',
  instructions:
    'Exyconn IT: IT service registers and workflows (incidents, changes, access and more), insights, assets and licences. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting anything or granting access.',
  typeDefs: [
    itRegistersTypeDefs,
    itWorkflowTypeDefs,
    itInsightsTypeDefs,
    assetsTypeDefs,
    licencesTypeDefs,
  ],
};
