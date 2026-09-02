import { TrainingModel } from './training.model';
import { trainingTypeDefs } from './training.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver, findOwnRecord } from '../../lib/employeeScope';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

interface TrainingInput {
  employeeId: string;
  title: string;
  provider: string;
  category: string;
  assignedOn: Date;
  dueOn?: Date | null;
  completedOn?: Date | null;
  status: string;
  certificateUrl?: string | null;
}

export const trainingService = createCrudService<TrainingInput>(TrainingModel as never, 'Training');

const crud = createCrudResolvers(trainingService, {
  name: 'Training',
  roles: [ROLES.HR],
  table: {
    searchFields: ['title', 'provider', 'category'],
    filterFields: ['employeeId', 'category', 'status'],
    sortFields: ['title', 'category', 'status', 'dueOn', 'createdAt'],
    defaultSort: { field: 'dueOn', dir: 'ASC' },
  },
  stats: { countBy: ['status'] },
});

interface TrainingDoc {
  status: string;
  completedOn: Date | null;
  save: () => Promise<unknown>;
  toObject: () => object;
}

/** Employee moves their own training forward; completing it stamps the date. */
async function updateMyTrainingStatus(
  _p: unknown,
  { id, status }: { id: string; status: string },
  ctx: GraphQLContext,
) {
  const training = await findOwnRecord<TrainingDoc>(TrainingModel as never, id, ctx);
  training.status = status;
  training.completedOn = status === 'COMPLETED' ? new Date() : null;
  await training.save();
  return withId(training.toObject() as { _id: unknown });
}

export const trainingResolvers = {
  Query: {
    ...crud.Query,
    myTrainings: createMyRecordsResolver(TrainingModel as never, { dueOn: 1 }),
  },
  Mutation: { ...crud.Mutation, updateMyTrainingStatus },
};
export { trainingTypeDefs };
