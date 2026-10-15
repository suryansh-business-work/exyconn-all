import { ROLES } from '../../../constants/roles';
import { actorNameOf } from '../../../lib/actor';
import { assertPlatformStaff } from '../../../lib/platformAccess';
import { assertSingleSignIn } from '../../../lib/rateLimiterSignIn';
import type { GraphQLContext } from '../../../middleware/auth';
import type { PermissionAction } from '../../permissions/permission.model';
import { recordAudit } from '../../audit';
import { authService } from '../auth.service';
import { auditedSignIn, signInFrom } from '../auth.resolvers';
import {
  googleSignInReady,
  presentGoogleConfig,
  readGoogleConfig,
  saveGoogleConfig,
  testGoogleConfig,
  type GoogleSignInConfigInput,
} from './google-sign-in.config';
import { redeemGoogleTicket, startGoogleSignIn } from './google-sign-in.flow';

const TECH_MODULE = 'TechConfig';
const techStaff = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, TECH_MODULE, [ROLES.TECH], action);

export const googleSignInResolvers = {
  Query: {
    googleSignInConfig: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'VIEW');
      return presentGoogleConfig(await readGoogleConfig());
    },
    googleSignInEnabled: async () => googleSignInReady(await readGoogleConfig()),
  },
  Mutation: {
    saveGoogleSignInConfig: async (
      _p: unknown,
      { input }: { input: GoogleSignInConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'EDIT');
      const saved = await saveGoogleConfig(input, await actorNameOf(ctx));
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: TECH_MODULE,
        entityId: 'google-sign-in',
        entityLabel: 'Google sign-in',
        summary: `Saved Google sign-in (${input.enabled ? 'on' : 'off'})`,
      });
      return presentGoogleConfig(saved);
    },
    testGoogleSignInConfig: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'EDIT');
      return testGoogleConfig();
    },
    startGoogleSignIn: (_p: unknown, { returnTo }: { returnTo: string }) =>
      startGoogleSignIn(returnTo),
    completeGoogleSignIn: async (
      _p: unknown,
      { ticket }: { ticket: string },
      ctx: GraphQLContext,
    ) => {
      assertSingleSignIn(ctx);
      const user = await redeemGoogleTicket(ticket);
      const result = await authService.signInProved(user, signInFrom(ctx));
      return auditedSignIn(result, ctx, 'Signed in with Google');
    },
  },
};
