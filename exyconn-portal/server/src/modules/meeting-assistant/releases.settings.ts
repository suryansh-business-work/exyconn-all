import { runAsPlatform } from '../../lib/tenant';
import { badRequest } from '../../utils/errors';
import { slackNotifier } from '../../utils/slack';
import { MaReleaseSettingsModel, type MaReleaseSettingsDocument } from './models';

/** `owner/repo` as GitHub names a repository (the same shape as @exyconn/regex GITHUB_REPOSITORY). */
const REPOSITORY = /^[\w.-]{1,100}\/[\w.-]{1,100}$/;

const KEY = 'global';

/** The install's release settings, created with their defaults the first time they are read. */
export function getReleaseSettings(): Promise<MaReleaseSettingsDocument> {
  return runAsPlatform(() =>
    MaReleaseSettingsModel.findOneAndUpdate(
      { key: KEY },
      { $setOnInsert: { key: KEY } },
      { new: true, upsert: true },
    ).lean<MaReleaseSettingsDocument>(),
  ) as Promise<MaReleaseSettingsDocument>;
}

export interface ReleaseSettingsInput {
  allowedRepository: string;
  slackChannelId: string;
  notifyOnNewBuild: boolean;
}

/**
 * The channel's name, checked against the workspace so a typo can never be saved. The channel
 * already saved keeps its name unchecked, so the repository can still be edited while Slack is
 * switched off.
 */
async function channelName(channelId: string): Promise<string> {
  if (channelId === '') {
    return '';
  }
  const saved = await getReleaseSettings();
  if (saved.slackChannelId === channelId) {
    return saved.slackChannelName;
  }
  const channel = (await slackNotifier.listChannels()).find((one) => one.id === channelId);
  if (!channel) {
    badRequest('That Slack channel is not visible to the Exyconn Slack app.');
  }
  return channel.name;
}

/** Saves the release settings a release manager edited. */
export async function updateReleaseSettings(
  input: ReleaseSettingsInput,
  byName: string,
): Promise<MaReleaseSettingsDocument> {
  const allowedRepository = input.allowedRepository.trim();
  if (!REPOSITORY.test(allowedRepository)) {
    badRequest('Enter the repository as owner/name, e.g. acme/portal.');
  }
  const slackChannelId = input.slackChannelId.trim();
  const slackChannelName = await channelName(slackChannelId);
  return runAsPlatform(() =>
    MaReleaseSettingsModel.findOneAndUpdate(
      { key: KEY },
      {
        allowedRepository,
        slackChannelId,
        slackChannelName,
        notifyOnNewBuild: input.notifyOnNewBuild,
        updatedByName: byName,
      },
      { new: true, upsert: true },
    ).lean<MaReleaseSettingsDocument>(),
  ) as Promise<MaReleaseSettingsDocument>;
}
