import type { GraphQLContext } from '../../middleware/auth';
import { slackNotifier } from '../../utils/slack';
import { presentRelease } from './ma.admin.resolvers';
import { assertMaUser } from './ma.access';
import type { ReleaseChannel } from './ma.enums';
import { startExtensionBuild } from './releases.github';
import { announcePublished } from './releases.notify';
import {
  approveRelease,
  assertReleaseManager,
  isReleaseManager,
  releaseCounts,
} from './releases.service';
import {
  getReleaseSettings,
  updateReleaseSettings,
  type ReleaseSettingsInput,
} from './releases.settings';
import type { MaReleaseSettingsDocument } from './models';

type Ctx = GraphQLContext;

async function presentSettings(settings: MaReleaseSettingsDocument) {
  return { ...settings, slackConfigured: await slackNotifier.isConfigured() };
}

export const maReleaseQueries = {
  maReleaseOverview: async (_p: unknown, _a: unknown, ctx: Ctx) => {
    await assertMaUser(ctx);
    if (!(await isReleaseManager(ctx))) {
      return { releaseManager: false, registered: 0, awaitingApproval: 0 };
    }
    return { releaseManager: true, ...(await releaseCounts()) };
  },
  maReleaseSettings: async (_p: unknown, _a: unknown, ctx: Ctx) => {
    await assertReleaseManager(ctx, 'VIEW');
    return presentSettings(await getReleaseSettings());
  },
  maReleaseSlackChannels: async (_p: unknown, _a: unknown, ctx: Ctx) => {
    await assertReleaseManager(ctx);
    return slackNotifier.listChannels();
  },
};

export const maReleaseMutations = {
  maApproveRelease: async (
    _p: unknown,
    args: { id: string; channel: ReleaseChannel },
    ctx: Ctx,
  ) => {
    const user = await assertReleaseManager(ctx);
    const release = await approveRelease(args.id, args.channel, user.email);
    announcePublished(release);
    return presentRelease(release);
  },
  maStartExtensionBuild: async (
    _p: unknown,
    { channel }: { channel: ReleaseChannel },
    ctx: Ctx,
  ) => {
    await assertReleaseManager(ctx);
    return startExtensionBuild(channel);
  },
  maUpdateReleaseSettings: async (
    _p: unknown,
    { input }: { input: ReleaseSettingsInput },
    ctx: Ctx,
  ) => {
    const user = await assertReleaseManager(ctx);
    return presentSettings(await updateReleaseSettings(input, user.email));
  },
};
