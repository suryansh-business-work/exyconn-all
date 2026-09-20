import { authService } from './auth.service';
import { requestPasswordReset, resetPassword } from './password-reset.service';
import { listSessions, revokeSession, revokeOtherSessions } from './session.service';
import { startMfaEnrolment, confirmMfaEnrolment, disableMfa, mfaStatus } from './mfa.service';
import { recordAudit } from '../audit';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { badRequest } from '../../utils/errors';
import { assertSingleSignIn } from '../../lib/rateLimiterSignIn';
import { withId } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { UpdateProfileInput } from './auth.service';

/** Where this request came from, as the session list will show it. */
const signInFrom = (ctx: GraphQLContext) => ({
  ip: ctx.ip ?? 'unknown',
  userAgent: ctx.userAgent ?? '',
});

/**
 * Records the sign-in and shapes the answer, for both halves of the two-factor flow.
 *
 * A challenge is not a sign-in and is deliberately not audited as one: it says only that
 * somebody typed the right password, which the failed-attempt limiter already watches.
 */
async function auditedSignIn(
  result: Awaited<ReturnType<typeof authService.login>>,
  ctx: GraphQLContext,
  summary: string,
) {
  if (result.mfaRequired || !result.user) {
    return { token: '', user: null, mfaRequired: true, mfaChallenge: result.mfaChallenge };
  }
  const signedIn = withId(result.user) as { id: string; name: string; email: string };
  await recordAudit(ctx, {
    action: 'LOGIN',
    module: 'Auth',
    entityId: signedIn.id,
    entityLabel: signedIn.email,
    summary,
    actor: { id: signedIn.id, name: signedIn.name, email: signedIn.email },
  });
  return { token: result.token, user: signedIn, mfaRequired: false, mfaChallenge: '' };
}

export const authResolvers = {
  Query: {
    me: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return withId(await authService.me(user.id));
    },
    mySessions: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return listSessions(user.id, ctx.user?.sid);
    },
    myMfaStatus: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return mfaStatus(user.id);
    },
  },
  Mutation: {
    login: async (
      _p: unknown,
      { email, password }: { email: string; password: string },
      ctx: GraphQLContext,
    ) => {
      assertSingleSignIn(ctx);
      const result = await authService.login(email, password, signInFrom(ctx));
      return auditedSignIn(result, ctx, 'Signed in');
    },
    /**
     * The second step for an account with two-factor on. Audited as its own line: "signed
     * in with a second factor" is a different fact from "signed in", and the difference is
     * what somebody reading the log after an incident is looking for.
     */
    verifyMfa: async (
      _p: unknown,
      { challenge, code }: { challenge: string; code: string },
      ctx: GraphQLContext,
    ) => {
      const result = await authService.completeMfaSignIn(challenge, code, signInFrom(ctx));
      return auditedSignIn(result, ctx, 'Signed in with a second factor');
    },
    /** Always the caller's own session: the id is checked against their own rows. */
    revokeSession: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      if (id === ctx.user?.sid) {
        badRequest('That is this session. Sign out instead.');
      }
      return revokeSession(user.id, id);
    },
    revokeOtherSessions: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return revokeOtherSessions(user.id, ctx.user?.sid);
    },
    startMfaEnrolment: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return startMfaEnrolment(user.id);
    },
    confirmMfaEnrolment: async (_p: unknown, { code }: { code: string }, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const codes = await confirmMfaEnrolment(user.id, code);
      await recordAudit(ctx, {
        action: 'SETTINGS',
        module: 'Auth',
        entityId: user.id,
        entityLabel: user.email,
        summary: 'Switched two-factor authentication on',
      });
      return codes;
    },
    disableMfa: async (_p: unknown, { password }: { password: string }, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const done = await disableMfa(user.id, password);
      await recordAudit(ctx, {
        action: 'SETTINGS',
        module: 'Auth',
        entityId: user.id,
        entityLabel: user.email,
        summary: 'Switched two-factor authentication off',
      });
      return done;
    },
    updateProfile: async (
      _p: unknown,
      { input }: { input: UpdateProfileInput },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      return withId(await authService.updateProfile(user.id, input));
    },
    changePassword: async (
      _p: unknown,
      { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      const changed = await authService.changePassword(user.id, currentPassword, newPassword);
      await recordAudit(ctx, {
        action: 'PASSWORD_RESET',
        module: 'Auth',
        entityId: user.id,
        entityLabel: user.email,
        summary: 'Changed own password',
      });
      return changed;
    },
    uploadAvatar: async (_p: unknown, { file }: { file: string }, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return authService.uploadAvatar(user.id, file);
    },
    // Deliberately unauthenticated: it exists for the case where nobody can sign
    // in. The service guards it by doing nothing once an ADMIN exists.
    sendAdminCredentials: () => authService.sendAdminCredentials(),
    // Unauthenticated by nature: both exist for people who cannot sign in.
    requestPasswordReset: (_p: unknown, { email }: { email: string }, ctx: GraphQLContext) =>
      requestPasswordReset(email, ctx),
    resetPassword: (
      _p: unknown,
      { token, newPassword }: { token: string; newPassword: string },
      ctx: GraphQLContext,
    ) => resetPassword(token, newPassword, ctx),
  },
};
