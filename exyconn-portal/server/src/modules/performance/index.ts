import { PerformanceReviewModel } from './review.model';
import { performanceTypeDefs } from './performance.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver, findOwnRecord } from '../../lib/employeeScope';
import { badRequest } from '../../utils/errors';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

interface PerformanceReviewInput {
  employeeId: string;
  cycle: string;
  selfAssessment: string;
  managerAssessment: string;
  competencies: string;
  score?: number | null;
  rating?: string | null;
  actionPlan: string;
  status: string;
}

export const performanceService = createCrudService<PerformanceReviewInput>(
  PerformanceReviewModel as never,
  'PerformanceReview',
);

const crud = createCrudResolvers(performanceService, {
  name: 'PerformanceReview',
  roles: [ROLES.HR],
  table: {
    searchFields: ['cycle', 'rating'],
    filterFields: ['employeeId', 'cycle', 'status'],
    sortFields: ['cycle', 'score', 'status', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status'] },
});

interface ReviewDoc {
  status: string;
  selfAssessment: string;
  save: () => Promise<unknown>;
  toObject: () => object;
}

/** Employee submits their self-assessment, only while the cycle is still open. */
async function submitSelfAssessment(
  _p: unknown,
  { id, text }: { id: string; text: string },
  ctx: GraphQLContext,
) {
  const review = await findOwnRecord<ReviewDoc>(PerformanceReviewModel as never, id, ctx);
  if (review.status !== 'OPEN') {
    badRequest('This review is no longer open for self-assessment');
  }
  review.selfAssessment = text;
  review.status = 'SELF_SUBMITTED';
  await review.save();
  return withId(review.toObject() as { _id: unknown });
}

export const performanceResolvers = {
  Query: {
    ...crud.Query,
    myPerformanceReviews: createMyRecordsResolver(PerformanceReviewModel as never, {
      createdAt: -1,
    }),
  },
  Mutation: { ...crud.Mutation, submitSelfAssessment },
};
export { performanceTypeDefs };
