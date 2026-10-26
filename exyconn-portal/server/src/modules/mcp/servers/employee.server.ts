import { employeeTypeDefs } from '../../employee/employee.typeDefs';
import { requestsTypeDefs } from '../../requests/requests.typeDefs';
import { approvalsTypeDefs } from '../../approvals/approvals.typeDefs';
import { notificationsTypeDefs } from '../../notifications/notifications.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * The employee self-service portal as an MCP server: the person's own profile, salary slips,
 * holidays, requests, approvals and notifications.
 *
 * An Employee feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Employee module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const EMPLOYEE_MCP: McpServerSpec = {
  key: 'employee',
  name: 'exyconn-employee',
  label: 'Employee',
  role: ROLES.EMPLOYEE,
  auditModule: 'Employee (Claude MCP)',
  instructions:
    "Exyconn Employee self-service: the person's own profile, salary slips, holidays, requests, approvals and notifications. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before submitting, approving or withdrawing anything.",
  typeDefs: [employeeTypeDefs, requestsTypeDefs, approvalsTypeDefs, notificationsTypeDefs],
};
