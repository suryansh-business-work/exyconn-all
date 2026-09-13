import { ManagementReviewModel } from './review.model';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { nextSequence } from '../../lib/sequence';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const REVIEW_SERIES = 'compliance-review';
const REVIEW_PREFIX = 'MR-';

interface ReviewAction {
  description: string;
  ownerName: string;
  dueOn?: Date | null;
  done: boolean;
}

export interface ManagementReviewInput {
  title: string;
  standards: string[];
  heldOn: Date;
  chairName: string;
  attendees: string;
  inputs: string;
  decisions: string;
  actions: ReviewAction[];
  status: string;
}

export const managementReviewsService = createCrudService<
  ManagementReviewInput & { reference: string }
>(ManagementReviewModel as never, 'ManagementReview');

const crud = createCrudResolvers(managementReviewsService, {
  name: 'ManagementReview',
  roles: [ROLES.COMPLIANCE],
  table: {
    searchFields: ['reference', 'title', 'chairName', 'attendees', 'decisions'],
    filterFields: ['status'],
    sortFields: ['reference', 'title', 'status', 'heldOn', 'createdAt'],
    defaultSort: { field: 'heldOn', dir: 'DESC' },
  },
  stats: { countBy: ['status'] },
});

async function createManagementReview(
  _p: unknown,
  { input }: { input: ManagementReviewInput },
  ctx: GraphQLContext,
) {
  const reference = await nextSequence(REVIEW_SERIES, REVIEW_PREFIX);
  return crud.Mutation.createManagementReview(_p, { input: { ...input, reference } } as never, ctx);
}

export const reviewResolvers = {
  Query: crud.Query,
  Mutation: { ...crud.Mutation, createManagementReview },
  ManagementReview: {
    /** How much of what the meeting decided has actually been done. */
    openActionCount: (review: { actions?: { done: boolean }[] }) =>
      (review.actions ?? []).filter((action) => !action.done).length,
  },
};
