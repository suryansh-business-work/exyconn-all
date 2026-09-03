import { EmailConfigModel } from './email-config.model';
import { ImageConfigModel } from './image-config.model';
import { SlackConfigModel } from './slack-config.model';
import { GithubConfigModel } from './github-config.model';
import { TrackerBuildSettingsModel } from './tracker-build-settings.model';
import { badRequest, notFound } from '../../utils/errors';
import { mailer } from '../../utils/mailer';
import { imageUploader } from '../../utils/imagekit';
import { slackNotifier } from '../../utils/slack';
import { githubActions } from '../../utils/github';

export interface EmailConfigInput {
  label: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
  isActive?: boolean;
}

export interface ImageConfigInput {
  label: string;
  provider?: string;
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
  isActive?: boolean;
}

export interface GithubConfigInput {
  label: string;
  owner: string;
  repo: string;
  token: string;
  isActive?: boolean;
}

/** Mirrors the GraphQL `TrackerPlatform` enum. */
export type TrackerPlatform = 'WINDOWS' | 'MACOS' | 'LINUX';

/** The settings row is a singleton, so it is always read and written under this key. */
const SETTINGS_KEY = 'default';

/** How many past runs the Tracker Build screen lists. */
const TRACKER_BUILD_HISTORY = 10;

export interface SlackConfigInput {
  label: string;
  botToken: string;
  defaultChannel: string;
  isActive?: boolean;
}

/**
 * Integration configs (email, image upload & Slack) behind Admin › Environment
 * Variables. Enforces a single active config per type so the mailer, uploader
 * and Slack notifier each have an unambiguous choice.
 */
class TechService {
  listEmailConfigs() {
    return EmailConfigModel.find().sort({ createdAt: -1 }).lean();
  }

  async createEmailConfig(input: EmailConfigInput) {
    if (input.isActive) await EmailConfigModel.updateMany({}, { isActive: false });
    return (await EmailConfigModel.create(input)).toObject();
  }

  async updateEmailConfig(id: string, input: EmailConfigInput) {
    if (input.isActive) {
      await EmailConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const doc = await EmailConfigModel.findByIdAndUpdate(id, input, { new: true }).lean();
    if (!doc) notFound('Email config');
    return doc;
  }

  async deleteEmailConfig(id: string) {
    const doc = await EmailConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Email config');
    return true;
  }

  /** Sends a verification email through a specific config to validate it. */
  async sendTestEmail(id: string, to: string) {
    const config = await EmailConfigModel.findById(id);
    if (!config) notFound('Email config');
    await mailer.sendTestEmail(config, to);
    return true;
  }

  listImageConfigs() {
    return ImageConfigModel.find().sort({ createdAt: -1 }).lean();
  }

  async createImageConfig(input: ImageConfigInput) {
    if (input.isActive) await ImageConfigModel.updateMany({}, { isActive: false });
    return (await ImageConfigModel.create(input)).toObject();
  }

  async updateImageConfig(id: string, input: ImageConfigInput) {
    if (input.isActive) {
      await ImageConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const doc = await ImageConfigModel.findByIdAndUpdate(id, input, { new: true }).lean();
    if (!doc) notFound('Image config');
    return doc;
  }

  async deleteImageConfig(id: string) {
    const doc = await ImageConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Image config');
    return true;
  }

  /** Uploads a file through a specific config and returns the hosted URL. */
  async testImageUpload(id: string, file: string, fileName: string) {
    const config = await ImageConfigModel.findById(id);
    if (!config) notFound('Image config');
    return imageUploader.uploadTest(config, file, fileName);
  }

  listSlackConfigs() {
    return SlackConfigModel.find().sort({ createdAt: -1 }).lean();
  }

  async createSlackConfig(input: SlackConfigInput) {
    if (input.isActive) await SlackConfigModel.updateMany({}, { isActive: false });
    return (await SlackConfigModel.create(input)).toObject();
  }

  async updateSlackConfig(id: string, input: SlackConfigInput) {
    if (input.isActive) {
      await SlackConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const doc = await SlackConfigModel.findByIdAndUpdate(id, input, { new: true }).lean();
    if (!doc) notFound('Slack config');
    return doc;
  }

  async deleteSlackConfig(id: string) {
    const doc = await SlackConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Slack config');
    return true;
  }

  /** Posts a message through a specific config to validate its bot token. */
  async sendTestSlackMessage(id: string, channel: string) {
    const config = await SlackConfigModel.findById(id);
    if (!config) notFound('Slack config');
    await slackNotifier.sendTestMessage(config, channel);
    return true;
  }

  /** Every channel the active Slack bot token can see. */
  listSlackChannels() {
    return slackNotifier.listChannels();
  }

  listGithubConfigs() {
    return GithubConfigModel.find().sort({ createdAt: -1 }).lean();
  }

  async createGithubConfig(input: GithubConfigInput) {
    if (input.isActive) await GithubConfigModel.updateMany({}, { isActive: false });
    return (await GithubConfigModel.create(input)).toObject();
  }

  async updateGithubConfig(id: string, input: GithubConfigInput) {
    if (input.isActive) {
      await GithubConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const doc = await GithubConfigModel.findByIdAndUpdate(id, input, { new: true }).lean();
    if (!doc) notFound('GitHub config');
    return doc;
  }

  async deleteGithubConfig(id: string) {
    const doc = await GithubConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('GitHub config');
    return true;
  }

  /** Reads the workflow through a specific config to validate its token and repo. */
  async testGithubConnection(id: string) {
    const config = await GithubConfigModel.findById(id);
    if (!config) notFound('GitHub config');
    await githubActions.verify(config);
    return true;
  }

  /** The most recent tracker build runs, newest first. */
  listTrackerBuilds() {
    return githubActions.listTrackerRuns(TRACKER_BUILD_HISTORY);
  }

  /** The single settings row, created empty the first time it is read. */
  async trackerBuildSettings() {
    const doc = await TrackerBuildSettingsModel.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $setOnInsert: { key: SETTINGS_KEY } },
      { new: true, upsert: true },
    ).lean();
    return doc;
  }

  async saveTrackerBuildSettings(slackChannels: string[]) {
    const doc = await TrackerBuildSettingsModel.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { slackChannels },
      { new: true, upsert: true },
    ).lean();
    return doc;
  }

  /**
   * Starts a tracker build. The chosen platforms and the Slack channels from
   * settings are passed to the workflow as inputs, so the run publishes exactly
   * the installers that were asked for and posts them where they are wanted.
   */
  async startTrackerBuild(platforms: TrackerPlatform[], ref: string) {
    if (platforms.length === 0) {
      badRequest('Choose at least one platform to build.');
    }
    const settings = await this.trackerBuildSettings();
    await githubActions.dispatchTrackerBuild(ref, {
      platforms: platforms.map((p) => p.toLowerCase()).join(','),
      slack_channels: settings.slackChannels.join(','),
    });
    return true;
  }
}

export const techService = new TechService();
