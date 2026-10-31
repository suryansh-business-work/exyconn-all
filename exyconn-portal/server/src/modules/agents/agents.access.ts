import { ROLES, type Role } from '../../constants/roles';
import { assertPlatformStaff } from '../../lib/platformAccess';
import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';

/**
 * The permission matrix row the Agents console is governed by: the calling bot's examples, call
 * flows and calls, and the console's overview. The bots' credentials stay under TechConfig and
 * its vault; the website chat keeps its own WebsiteChatSession row.
 */
export const AGENTS_MODULE = 'AgentConsole';

/** Who runs the agents: the Agents team, and Tech staff who ran them before the console existed. */
export const AGENTS_ROLES: Role[] = [ROLES.AGENTS, ROLES.TECH];

/** The agents are the platform's own demos, so only the operator's staff (or SUPER_ADMIN) pass. */
export const assertAgentStaff = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, AGENTS_MODULE, AGENTS_ROLES, action);
