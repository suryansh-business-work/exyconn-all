import { projectsTypeDefs } from '../../projects/projects.typeDefs';
import { boardTypeDefs } from '../../projects/board.typeDefs';
import { docsTypeDefs } from '../../projects/docs.typeDefs';
import { sprintsTypeDefs } from '../../projects/sprints.typeDefs';
import { shareTypeDefs } from '../../projects/share.typeDefs';
import { ticketTypeDefs } from '../../projects/ticket.typeDefs';
import { workflowsTypeDefs } from '../../projects/workflows.typeDefs';
import { projectHealthTypeDefs } from '../../projects/projects.health.typeDefs';
import { bugsTypeDefs } from '../../bugs/bugs.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * Projects as an MCP server: projects, boards and tickets, sprints, docs, sharing, workflows,
 * project health and bugs.
 *
 * A Projects feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Projects module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const PROJECTS_MCP: McpServerSpec = {
  key: 'projects',
  name: 'exyconn-projects',
  label: 'Projects',
  role: ROLES.PROJECTS,
  auditModule: 'Projects (Claude MCP)',
  instructions:
    'Exyconn Projects: projects, boards and tickets, sprints, docs, sharing, workflows, project health and bugs. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting or sharing anything.',
  typeDefs: [
    projectsTypeDefs,
    boardTypeDefs,
    docsTypeDefs,
    sprintsTypeDefs,
    shareTypeDefs,
    ticketTypeDefs,
    workflowsTypeDefs,
    projectHealthTypeDefs,
    bugsTypeDefs,
  ],
};
