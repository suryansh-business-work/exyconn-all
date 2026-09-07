import { PerformanceReviewModel } from './review.model';
import { performanceTypeDefs } from './performance.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver, findOwnRecord } from '../../lib/employeeScope';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { badRequest, notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { notifyBestEffort } from '../notifications';
import { assertMayActFor, directReportIds, teamScope } from '../admin/reporting';
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

const SCORE_MIN = 0;
const SCORE_MAX = 10;

interface ManagerAssessmentArgs {
  id: string;
  managerAssessment: string;
  score?: number | null;
}

/**
 * The manager's half of the appraisal. Only once the employee has submitted theirs —
 * an assessment written before the self-assessment is read is not a review of it.
 */
async function submitManagerAssessment(
  _p: unknown,
  { id, managerAssessment, score }: ManagerAssessmentArgs,
  ctx: GraphQLContext,
) {
  const review = await PerformanceReviewModel.findById(id);
  if (!review) notFound('PerformanceReview');
  await assertMayActFor(ctx, review.employeeId, [ROLES.HR]);
  if (review.status !== 'SELF_SUBMITTED') {
    badRequest('The employee has not submitted their self-assessment yet');
  }
  if (score != null && (score < SCORE_MIN || score > SCORE_MAX)) {
    badRequest(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
  }
  review.managerAssessment = managerAssessment;
  if (score != null) review.score = score;
  review.status = 'MANAGER_SUBMITTED';
  await review.save();
  await notifyBestEffort(review.employeeId, {
    kind: 'PERFORMANCE',
    title: `Manager assessment submitted: ${review.cycle}`,
    body: 'Your manager has written their half of the appraisal.',
    link: '/me/performance',
  });
  return withId(review.toObject());
}

/** Every appraisal of the signed-in user's direct reports. */
async function teamPerformanceReviews(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  const user = assertAuthenticated(ctx);
  const ids = await directReportIds(user.id);
  if (ids.length === 0) return [];
  const rows = await PerformanceReviewModel.find(teamScope(ids)).sort({ createdAt: -1 }).lean();
  return withIds(rows);
}

export const performanceResolvers = {
  Query: {
    ...crud.Query,
    myPerformanceReviews: createMyRecordsResolver(PerformanceReviewModel as never, {
      createdAt: -1,
    }),
    teamPerformanceReviews,
  },
  Mutation: { ...crud.Mutation, submitSelfAssessment, submitManagerAssessment },
};
export { performanceTypeDefs };
