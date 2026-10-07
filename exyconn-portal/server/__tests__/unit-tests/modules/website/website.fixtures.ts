import { Types } from 'mongoose';
import { ROLES } from '../../../../src/constants/roles';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { WebsiteSubmissionModel } from '../../../../src/modules/website/models';

/** Shared set-up for the website suites (not a suite itself: jest only runs *.test.ts). */

export const ADMIN_EMAIL = 'web-admin@exyconn.test';

/**
 * A platform administrator (SUPER_ADMIN in no company), whom every website guard lets through.
 * No user record backs the id, so anything that names the caller falls back to the email.
 */
export const adminCtx = (): GraphQLContext => ({
  user: { id: String(new Types.ObjectId()), roles: [ROLES.SUPER_ADMIN], email: ADMIN_EMAIL },
});

/** A website editor in an ordinary customer company, which does not run the platform. */
export const customerEditorCtx = (): GraphQLContext => {
  invalidatePlatformOperatorCache();
  const organizationId = String(new Types.ObjectId());
  return {
    user: {
      id: String(new Types.ObjectId()),
      roles: [ROLES.WEBSITE],
      email: 'web@customer.test',
      organizationId,
    },
    organizationId,
  };
};

/** Files a submission straight into the inbox, the way the public mutation leaves one. */
export const seedSubmission = (
  formType = 'contact',
  submissionData: Record<string, unknown> = { email: 'visitor@example.com' },
  extra: Record<string, unknown> = {},
) => WebsiteSubmissionModel.create({ formType, submissionData, ...extra });

/** Moves a row's creation time back, so ordering by `createdAt` is not left to the clock. */
export const backdate = (id: unknown, daysAgo: number) =>
  WebsiteSubmissionModel.collection.updateOne(
    { _id: id as Types.ObjectId },
    { $set: { createdAt: new Date(Date.now() - daysAgo * 86_400_000) } },
  );
