import { ROLES } from '../../constants/roles';
import { actorNameOf } from '../../lib/actor';
import { assertPlatformStaff } from '../../lib/platformAccess';
import type { GraphQLContext } from '../../middleware/auth';
import { assertRole } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import type { TableQueryInput } from '../../utils/tableQuery';
import type { PermissionAction } from '../permissions/permission.model';
import type { VerificationSource } from './email-verification.model';
import { verificationLoader } from './email-verification.loader';
import {
  createBatch,
  listBatches,
  listVerifications,
  verifyEmail,
} from './email-verification.service';
import {
  emailVerifierConfigs,
  type EmailVerifierConfigInput,
} from './email-verifier-config.service';

/** The verifier is the sales desk's: the same people who work the CRM. */
const crmDesk = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.CRM]);

/** The proxy sits with the install's other credentials: the platform's own Tech staff only. */
const techStaff = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], action);

/** Any row with an email gets its latest check, batched per request. */
const latestCheck = (row: { email?: string | null }, _a: unknown, ctx: GraphQLContext) =>
  row.email
    ? verificationLoader(ctx)(row.email).then((found) => (found ? withId(found) : null))
    : null;

export const emailVerificationResolvers = {
  Contact: { emailVerification: latestCheck },
  Lead: { emailVerification: latestCheck },
  EmailVerifierConfig: {
    hasProxyPassword: (row: { proxyPassword?: string }) => Boolean(row.proxyPassword),
  },
  Query: {
    emailVerificationsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      crmDesk(ctx);
      const page = await listVerifications(input);
      return { ...page, rows: withIds(page.rows as Array<{ _id?: unknown }>) };
    },
    emailVerificationBatches: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      crmDesk(ctx);
      return withIds(await listBatches());
    },
    emailVerifierConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'VIEW');
      return withIds(await emailVerifierConfigs.list());
    },
  },
  Mutation: {
    verifyEmail: async (
      _p: unknown,
      { email, source }: { email: string; source?: VerificationSource | null },
      ctx: GraphQLContext,
    ) => {
      crmDesk(ctx);
      const checked = await verifyEmail(email, {
        source: source ?? 'SINGLE',
        checkedBy: await actorNameOf(ctx),
      });
      return withId(checked);
    },
    createEmailVerificationBatch: async (
      _p: unknown,
      { name, emails }: { name: string; emails: string[] },
      ctx: GraphQLContext,
    ) => {
      crmDesk(ctx);
      const batch = await createBatch(name, emails, await actorNameOf(ctx));
      return withId({ ...batch, total: batch.emails.length });
    },
    createEmailVerifierConfig: async (
      _p: unknown,
      { input }: { input: EmailVerifierConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'CREATE');
      return withId(await emailVerifierConfigs.create(input));
    },
    updateEmailVerifierConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: EmailVerifierConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'EDIT');
      return withId(await emailVerifierConfigs.update(id, input));
    },
    testEmailVerifierConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await techStaff(ctx, 'EDIT');
      return emailVerifierConfigs.test(id);
    },
    deleteEmailVerifierConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await techStaff(ctx, 'DELETE');
      return emailVerifierConfigs.remove(id);
    },
  },
};
