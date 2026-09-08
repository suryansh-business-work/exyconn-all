import { authService } from './auth.service';
import { requestPasswordReset, resetPassword } from './password-reset.service';
import { recordAudit } from '../audit';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { UpdateProfileInput } from './auth.service';

export const authResolvers = {
  Query: {
    me: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return withId(await authService.me(user.id));
    },
  },
  Mutation: {
    login: async (
      _p: unknown,
      { email, password }: { email: string; password: string },
      ctx: GraphQLContext,
    ) => {
      const { token, user } = await authService.login(email, password);
      const signedIn = withId(user);
      await recordAudit(ctx, {
        action: 'LOGIN',
        module: 'Auth',
        entityId: signedIn.id,
        entityLabel: signedIn.email,
        summary: 'Signed in',
        actor: { id: signedIn.id, name: signedIn.name, email: signedIn.email },
      });
      return { token, user: signedIn };
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
