import { WebsiteSubmissionModel } from './models';
import { SUBMISSION_FORM_TYPES, SUBMISSION_STATUSES } from './website.constants';
import type { GraphQLContext } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';
import { assertRole } from '../../middleware/roleGuard';
import { assertPermission } from '../../lib/permissions';
import { withId, withIds } from '../../utils/serialize';
import { badRequest, notFound } from '../../utils/errors';
import { tableQuery, tableStats, type TableQueryInput } from '../../utils/tableQuery';
import { mailer } from '../../utils/mailer';
import { logger } from '../../utils/logger';
import { createApplicantFromSubmission } from '../recruiting/recruiting.service';
import { JOB_APPLICATION_FORM_TYPE } from '../recruiting/recruiting.constants';

const ALLOWED_FORM_TYPES = new Set<string>(SUBMISSION_FORM_TYPES);
const ALLOWED_STATUSES = new Set<string>(SUBMISSION_STATUSES);

/** Matches the UI route guard for /portal/website. ADMIN passes every guard. */
const GUARD_ROLES = [ROLES.WEBSITE];

/**
 * What the inbox grid may search, filter and sort on. `submissionData` is deliberately not
 * here: it is free-form per form type, so a regex across it would scan a different shape for
 * every row and could reach fields no column ever shows.
 */
const SUBMISSION_TABLE = {
  searchFields: ['formType', 'source', 'status', 'notes'],
  filterFields: ['formType', 'source', 'status'],
  sortFields: ['formType', 'source', 'status', 'createdAt', 'updatedAt'],
  defaultSort: { field: 'createdAt', dir: 'DESC' as const },
};

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

/** Reads the submitter's address, when the form collected one, for the Reply-To header. */
function replyToOf(submissionData: Record<string, unknown>): string | undefined {
  const email = submissionData.email;
  return typeof email === 'string' && email ? email : undefined;
}

/**
 * Files a job application as an HR applicant and links the two. Best-effort: the
 * submission is the durable record, so a bad payload is logged and the visitor still
 * gets their confirmation.
 */
async function fileApplicant(submissionId: string, data: Record<string, unknown>) {
  try {
    const applicant = await createApplicantFromSubmission(submissionId, data);
    await WebsiteSubmissionModel.updateOne(
      { _id: submissionId },
      { applicantId: String(applicant._id) },
    );
    return String(applicant._id);
  } catch (error) {
    logger.error({ error }, `Submission ${submissionId} stored, but its applicant failed`);
    return null;
  }
}

/**
 * `createWebsiteSubmission` is public (the website posts every form through it), so
 * it validates `formType` against an allow-list rather than trusting the caller —
 * an open mutation must not let anonymous traffic invent arbitrary buckets.
 *
 * The stored submission is the durable record, so the notification email is
 * best-effort: the team can always see the submission in the portal, and a mail
 * outage must not make a visitor re-submit and create a duplicate record.
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

    listWebsiteSubmissionsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, GUARD_ROLES);
      const page = await tableQuery(WebsiteSubmissionModel, input, SUBMISSION_TABLE);
      return {
        rows: withIds(page.rows as Array<{ _id: unknown }>),
        totalCount: page.totalCount,
      };
    },

    listWebsiteSubmissionsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, GUARD_ROLES);
      return tableStats(WebsiteSubmissionModel, { countBy: ['status', 'formType'] });
    },

    /**
     * The form identifiers the website may submit under, so the portal UI offers exactly
     * what {@link ALLOWED_FORM_TYPES} accepts rather than a hand-copied second list.
     */
    websiteFormTypes: () => [...SUBMISSION_FORM_TYPES],

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
      const submissionData = (input.submissionData ?? {}) as Record<string, unknown>;
      const applicantId =
        input.formType === JOB_APPLICATION_FORM_TYPE
          ? await fileApplicant(String(created._id), submissionData)
          : null;
      try {
        await mailer.sendFormSubmissionEmail({
          formType: input.formType,
          submissionData,
          replyTo: replyToOf(submissionData),
        });
      } catch (error) {
        logger.error({ error }, `Submission ${input.formType} stored, but its email failed`);
      }
      return withId({ ...created.toObject(), applicantId });
    },

    triageWebsiteSubmission: async (
      _p: unknown,
      { id, input }: { id: string; input: TriageInput },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, 'WebsiteSubmission', GUARD_ROLES, 'APPROVE');
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
