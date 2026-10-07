import { Types } from 'mongoose';
import { boardResolvers } from '../../../../src/modules/projects/board.resolvers';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { seedUser } from '../../../helpers';
import type { TaskInput } from '../../../../src/modules/projects/board.service';
import type { GraphQLContext } from '../../../../src/middleware/auth';

/** Shared set-up for the projects suites (not a suite itself: jest only runs *.test.ts). */

/** Built at runtime so no credential sits in the source. */
export const PASSWORD = process.env.TEST_USER_PASSWORD ?? `pw-${'x'.repeat(12)}`;

/** An id that matches no record, for the "does not exist" paths. */
export const missingId = () => String(new Types.ObjectId());

export const ctxFor = (
  id: string,
  roles: Role[] = [ROLES.PROJECTS],
  email = 'lead@exyconn.com',
): GraphQLContext => ({ user: { id, roles, email } });

/** A real person with the given roles, and the request context they would sign in with. */
export async function seedMember(email = 'lead@exyconn.com', roles: Role[] = [ROLES.PROJECTS]) {
  const user = await seedUser(email, PASSWORD, roles);
  return { user, ctx: ctxFor(user.id, roles, email) };
}

export const newProject = (name = 'Billing') => ProjectModel.create({ name, status: 'ACTIVE' });

export const addColumn = (ctx: GraphQLContext, projectId: string, name: string) =>
  boardResolvers.Mutation.createColumn(null, { projectId, name }, ctx);

export const addTicket = (
  ctx: GraphQLContext,
  projectId: string,
  columnId: string,
  input: TaskInput,
) => boardResolvers.Mutation.createTask(null, { projectId, columnId, input }, ctx);

/** A project with one To do column, run by a lead — what most board tests start from. */
export async function boardWithLead() {
  const { user, ctx } = await seedMember();
  const project = await newProject();
  const todo = await addColumn(ctx, project.id, 'To do');
  return { lead: user, ctx, projectId: String(project.id), todo };
}
