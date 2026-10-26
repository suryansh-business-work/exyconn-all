import { adminTypeDefs } from '../../admin/admin.typeDefs';
import { organizationsTypeDefs } from '../../organizations/organizations.typeDefs';
import { permissionsTypeDefs } from '../../permissions/permissions.typeDefs';
import { auditTypeDefs } from '../../audit/audit.typeDefs';
import { brandingTypeDefs } from '../../branding/branding.typeDefs';
import { i18nTypeDefs } from '../../i18n/i18n.typeDefs';
import { integrationsTypeDefs } from '../../integrations/integrations.typeDefs';
import { healthTypeDefs } from '../../health/health.typeDefs';
import { analyticsTypeDefs } from '../../analytics/analytics.typeDefs';
import { clientsTypeDefs } from '../../clients/clients.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * Admin as an MCP server: users and their roles, organizations, permissions, the audit log,
 * branding, localization, integrations, system health, analytics and clients.
 *
 * An Admin feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Admin module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const ADMIN_MCP: McpServerSpec = {
  key: 'admin',
  name: 'exyconn-admin',
  label: 'Admin',
  role: ROLES.ADMIN,
  auditModule: 'Admin (Claude MCP)',
  instructions:
    'Exyconn Admin: users and roles, organizations, permissions, the audit log, branding, localization, integrations, system health, analytics and clients. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting anything or changing who can access what.',
  typeDefs: [
    adminTypeDefs,
    organizationsTypeDefs,
    permissionsTypeDefs,
    auditTypeDefs,
    brandingTypeDefs,
    i18nTypeDefs,
    integrationsTypeDefs,
    healthTypeDefs,
    analyticsTypeDefs,
    clientsTypeDefs,
  ],
};
