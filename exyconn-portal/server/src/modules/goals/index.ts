import { GoalModel } from './goal.model';
import { goalsTypeDefs } from './goals.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver, findOwnRecord } from '../../lib/employeeScope';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { assertNotOwnRecord, refuseOwnRecordWrites } from '../../lib/permissions';
import { badRequest, notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { assertMayActFor, directReportIds, teamScope } from '../admin/reporting';
import type { GraphQLContext } from '../../middleware/auth';

interface GoalInput {
  employeeId: string;
  title: string;
  description: string;
  kpi: string;
  weightage: number;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: string;
  managerComment?: string | null;
}

export const goalsService = createCrudService<GoalInput>(GoalModel as never, 'Goal');

const crud = createCrudResolvers(goalsService, {
  name: 'Goal',
  roles: [ROLES.HR],
  table: {
    searchFields: ['title', 'description', 'kpi'],
    filterFields: ['employeeId', 'status'],
    sortFields: ['title', 'weightage', 'progress', 'status', 'endDate', 'createdAt'],
    defaultSort: { field: 'endDate', dir: 'DESC' },
  },
  stats: { countBy: ['status'], sum: ['weightage'] },
});

/** The employee moves progress on their own goal; everything else stays HR-owned. */
async function updateMyGoalProgress(
  _p: unknown,
  { id, progress }: { id: string; progress: number },
  ctx: GraphQLContext,
) {
  if (progress < 0 || progress > 100) badRequest('Progress must be between 0 and 100');
  const goal = await findOwnRecord<{
    progress: number;
    save: () => Promise<unknown>;
    toObject: () => object;
  }>(GoalModel as never, id, ctx);
  goal.progress = progress;
  await goal.save();
  return withId(goal.toObject() as { _id: unknown });
}

/** The manager's note on a direct report's goal; the rest of the goal stays HR-owned. */
async function commentOnTeamGoal(
  _p: unknown,
  { id, comment }: { id: string; comment: string },
  ctx: GraphQLContext,
) {
  const goal = await GoalModel.findById(id);
  if (!goal) notFound('Goal');
  await assertMayActFor(ctx, goal.employeeId, [ROLES.HR]);
  assertNotOwnRecord(ctx, goal.employeeId, 'write the manager’s comment');
  goal.managerComment = comment;
  await goal.save();
  return withId(goal.toObject());
}

/** Every goal of the signed-in user's direct reports. */
async function teamGoals(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  const user = assertAuthenticated(ctx);
  const ids = await directReportIds(user.id);
  if (ids.length === 0) return [];
  return withIds(await GoalModel.find(teamScope(ids)).sort({ endDate: -1 }).lean());
}

export const goalsResolvers = {
  Query: {
    ...crud.Query,
    myGoals: createMyRecordsResolver(GoalModel as never, { endDate: -1 }),
    teamGoals,
  },
  Mutation: {
    // HR's console may not set the caller's own goal status; their progress has its own mutation.
    ...refuseOwnRecordWrites(crud.Mutation, 'Goal', async (id) => {
      const row = await GoalModel.findById(id).select('employeeId').lean();
      return row?.employeeId;
    }),
    updateMyGoalProgress,
    commentOnTeamGoal,
  },
};
export { goalsTypeDefs };
