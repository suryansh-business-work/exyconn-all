import { GoalModel } from './goal.model';
import { goalsTypeDefs } from './goals.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver, findOwnRecord } from '../../lib/employeeScope';
import { badRequest } from '../../utils/errors';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
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
  const goal = await findOwnRecord<{ progress: number; save: () => Promise<unknown>; toObject: () => object }>(
    GoalModel as never,
    id,
    ctx,
  );
  goal.progress = progress;
  await goal.save();
  return withId(goal.toObject() as { _id: unknown });
}

export const goalsResolvers = {
  Query: { ...crud.Query, myGoals: createMyRecordsResolver(GoalModel as never, { endDate: -1 }) },
  Mutation: { ...crud.Mutation, updateMyGoalProgress },
};
export { goalsTypeDefs };
