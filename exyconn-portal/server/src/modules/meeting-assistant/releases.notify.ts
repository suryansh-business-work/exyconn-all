import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { slackNotifier } from '../../utils/slack';
import type { LeanRelease } from './releases.service';
import type { MaReleaseSettingsDocument } from './models';
import { getReleaseSettings } from './releases.settings';

/** How much of a build's changelog a Slack post quotes. */
const NOTES_IN_POST = 500;

/** The Chrome Extension page every employee installs from: the download stays behind sign-in. */
const extensionPageUrl = () => `${env.meetAssistant.portalUrl}/me/meetings/extension`;

function summary(release: LeanRelease): string {
  const notes = release.releaseNotes.trim();
  if (notes === '') {
    return '';
  }
  const short = notes.length > NOTES_IN_POST ? `${notes.slice(0, NOTES_IN_POST)}…` : notes;
  return `\n>${short.replaceAll('\n', '\n>')}`;
}

/** Posts `text` to the chosen channel when one is chosen, Slack is set up and `wanted` says so. */
async function postIf(
  wanted: (settings: MaReleaseSettingsDocument) => boolean,
  text: string,
): Promise<void> {
  const settings = await getReleaseSettings();
  if (
    !wanted(settings) ||
    settings.slackChannelId === '' ||
    !(await slackNotifier.isConfigured())
  ) {
    return;
  }
  await slackNotifier.post(settings.slackChannelId, text);
}

const publishedText = (release: LeanRelease) =>
  `:rocket: *Exyconn Meeting Assistant ${release.version}* is ready to install (${release.channel} channel).${summary(release)}\nDownload it in the portal: ${extensionPageUrl()}`;

const newBuildText = (release: LeanRelease) =>
  `:package: Meeting Assistant build *${release.version}* arrived and is waiting for approval.${summary(release)}\nReview it: ${env.meetAssistant.releasesUrl}`;

/** Announces an approved build in the chosen Slack channel. A Slack failure never fails the approval. */
export function announcePublished(release: LeanRelease): void {
  postIf(() => true, publishedText(release)).catch((error: unknown) =>
    logger.warn({ err: error, version: release.version }, 'Slack release announcement failed'),
  );
}

/** Tells the channel a new build is waiting for QA, when the settings ask for it. */
export function announceNewBuild(release: LeanRelease): void {
  postIf((settings) => settings.notifyOnNewBuild, newBuildText(release)).catch((error: unknown) =>
    logger.warn({ err: error, version: release.version }, 'Slack new-build post failed'),
  );
}
