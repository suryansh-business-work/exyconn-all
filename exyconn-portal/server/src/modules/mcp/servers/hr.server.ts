import { hrTypeDefs } from '../../hr/hr.typeDefs';
import { attendanceTypeDefs } from '../../hr/attendance.typeDefs';
import { hrMasterTypeDefs } from '../../hrmaster/hrmaster.typeDefs';
import { orgMasterTypeDefs } from '../../orgmaster/orgmaster.typeDefs';
import { recruitingTypeDefs } from '../../recruiting/recruiting.typeDefs';
import { onboardingTypeDefs } from '../../onboarding/onboarding.typeDefs';
import { exitTypeDefs } from '../../exit/exit.typeDefs';
import { performanceTypeDefs } from '../../performance/performance.typeDefs';
import { goalsTypeDefs } from '../../goals/goals.typeDefs';
import { benefitsTypeDefs } from '../../benefits/benefits.typeDefs';
import { trainingTypeDefs } from '../../training/training.typeDefs';
import { documentsTypeDefs } from '../../documents/documents.typeDefs';
import { payrollTypeDefs } from '../../payroll/payroll.typeDefs';
import { payoutTypeDefs } from '../../payout/payout.typeDefs';
import { announcementsTypeDefs } from '../../announcements/announcements.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * HR as an MCP server: employees, attendance, the HR and organization masters, recruiting,
 * onboarding and exits, performance and goals, benefits, training, documents, payroll, salary
 * accounts and announcements.
 *
 * An HR feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW HR module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const HR_MCP: McpServerSpec = {
  key: 'hr',
  name: 'exyconn-hr',
  label: 'HR',
  role: ROLES.HR,
  auditModule: 'HR (Claude MCP)',
  instructions:
    'Exyconn HR: employees, attendance, HR and organization masters, recruiting, onboarding and exits, performance and goals, benefits, training, documents, payroll, salary accounts and announcements. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting anything, running payroll or changing pay.',
  typeDefs: [
    hrTypeDefs,
    attendanceTypeDefs,
    hrMasterTypeDefs,
    orgMasterTypeDefs,
    recruitingTypeDefs,
    onboardingTypeDefs,
    exitTypeDefs,
    performanceTypeDefs,
    goalsTypeDefs,
    benefitsTypeDefs,
    trainingTypeDefs,
    documentsTypeDefs,
    payrollTypeDefs,
    payoutTypeDefs,
    announcementsTypeDefs,
  ],
};
