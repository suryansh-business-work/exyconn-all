import { assertRole } from '../../middleware/roleGuard';
import { assertPlatformStaff, callerOrganization } from '../../lib/platformAccess';
import { ROLES } from '../../constants/roles';
import { portalOrigin } from '../../utils/portalOrigin';
import { withIds } from '../../utils/serialize';
import { badRequest } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';
import { secretHint } from '../tech/tech.secrets';
import type { SocialApp, SocialNetwork } from './social.constants';
import {
  appConfigs,
  disconnect,
  listAccounts,
  saveAppConfig,
  startConnect,
  type SocialAppConfigInput,
} from './social.service';
import { socialAccountsTypeDefs } from './social.typeDefs';

export { socialCallbackRouter } from './social.routes';
export { SOCIAL_CALLBACK_PATH } from './social.constants';

/** App credentials are the install's, like SMTP or Slack: the platform's own Tech staff. */
const techGuard = (ctx: GraphQLContext) =>
  assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], 'EDIT');
const marketingGuard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.MARKETING]);

/** Where Marketing's page for this lives, so the callback can return there. */
const SOCIAL_PAGE = '/marketing/social';

const NETWORKS: Readonly<Record<SocialApp, SocialNetwork[]>> = {
  LINKEDIN: ['LINKEDIN'],
  META: ['FACEBOOK', 'INSTAGRAM'],
  X: ['X'],
  YOUTUBE: ['YOUTUBE'],
};

export const socialAccountsResolvers = {
  Query: {
    socialAppConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techGuard(ctx);
      return appConfigs();
    },
    socialAppStatuses: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      marketingGuard(ctx);
      return (await appConfigs()).map((config) => ({
        app: config.app,
        label: config.label,
        available: config.enabled && config.clientId !== '' && config.clientSecret !== '',
        networks: NETWORKS[config.app],
      }));
    },
    socialAccounts: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      marketingGuard(ctx);
      return withIds(await listAccounts());
    },
  },
  Mutation: {
    saveSocialAppConfig: async (
      _p: unknown,
      { input }: { input: SocialAppConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techGuard(ctx);
      return saveAppConfig(input);
    },
    startSocialConnect: async (_p: unknown, { app }: { app: SocialApp }, ctx: GraphQLContext) => {
      const user = marketingGuard(ctx);
      const organizationId = callerOrganization(ctx, user);
      if (organizationId === null) {
        badRequest('Connect social accounts from inside a company workspace');
      }
      const returnTo = `${portalOrigin(ctx.origin)}${SOCIAL_PAGE}`;
      return startConnect(app, organizationId, user.id, returnTo);
    },
    disconnectSocialAccount: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      marketingGuard(ctx);
      return disconnect(id);
    },
  },
  SocialAppConfig: {
    hasClientSecret: (row: { clientSecret: string }) => row.clientSecret !== '',
    clientSecretHint: (row: { clientSecret: string }) => secretHint(row.clientSecret),
  },
};
export { socialAccountsTypeDefs };
