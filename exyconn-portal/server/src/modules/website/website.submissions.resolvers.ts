import { WebsiteSubmissionModel } from './models';
import { SUBMISSION_FORM_TYPES, SUBMISSION_STATUSES } from './website.constants';
import type { GraphQLContext } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';
import { assertRole } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import { badRequest, notFound } from '../../utils/errors';

const ALLOWED_FORM_TYPES = new Set<string>(SUBMISSION_FORM_TYPES);
const ALLOWED_STATUSES = new Set<string>(SUBMISSION_STATUSES);

/** Matches the UI route guard for /portal/website. ADMIN passes every guard. */
const GUARD_ROLES = [ROLES.WEBSITE];

interface SubmissionInput {
  formType: string;
  source?: string;
  submissionData: Record<string, unknown>;
  status?: string;
  notes?: string;
}

interface TriageInput {
  status: string;
  notes?: string;
}

/**
 * `createWebsiteSubmission` is public (the website posts every form through it), so
 * it validates `formType` against an allow-list rather than trusting the caller —
 * an open mutation must not let anonymous traffic invent arbitrary buckets.
 */
export const websiteSubmissionResolvers = {
  Query: {
    listWebsiteSubmissions: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, GUARD_ROLES);
      return withIds(
        (await WebsiteSubmissionModel.find().sort({ createdAt: -1 }).lean()) as Array<{
          _id: unknown;
        }>,
      );
    },

    getWebsiteSubmission: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, GUARD_ROLES);
      const doc = await WebsiteSubmissionModel.findById(id).lean();
      if (!doc) {
        notFound('Submission');
      }
      return withId(doc as { _id: unknown });
    },
  },

  Mutation: {
    createWebsiteSubmission: async (_p: unknown, { input }: { input: SubmissionInput }) => {
      if (!ALLOWED_FORM_TYPES.has(input.formType)) {
        badRequest(`Unknown form type: ${input.formType}`);
      }
      const created = await WebsiteSubmissionModel.create({
        formType: input.formType,
        source: input.source ?? 'website',
        submissionData: input.submissionData ?? {},
        status: 'new',
        notes: '',
      });
      return withId(created.toObject());
    },

    triageWebsiteSubmission: async (
      _p: unknown,
      { id, input }: { id: string; input: TriageInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, GUARD_ROLES);
      if (!ALLOWED_STATUSES.has(input.status)) {
        badRequest(`Unknown status: ${input.status}`);
      }
      const updated = await WebsiteSubmissionModel.findByIdAndUpdate(
        id,
        { status: input.status, notes: input.notes ?? '' },
        { new: true },
      ).lean();
      if (!updated) {
        notFound('Submission');
      }
      return withId(updated as { _id: unknown });
    },

    deleteWebsiteSubmission: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, GUARD_ROLES);
      const deleted = await WebsiteSubmissionModel.findByIdAndDelete(id).lean();
      if (!deleted) {
        notFound('Submission');
      }
      return true;
    },
  },
};
