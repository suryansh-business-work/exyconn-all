import { authService } from './auth.service';
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
    login: async (_p: unknown, { email, password }: { email: string; password: string }) => {
      const { token, user } = await authService.login(email, password);
      return { token, user: withId(user) };
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
      return authService.changePassword(user.id, currentPassword, newPassword);
    },
    uploadAvatar: async (_p: unknown, { file }: { file: string }, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return authService.uploadAvatar(user.id, file);
    },
  },
};
