import { Writable } from 'node:stream';
import { Types } from 'mongoose';
import {
  announceNewBuild,
  announcePublished,
} from '../../../../src/modules/meeting-assistant/releases.notify';
import * as releaseSettings from '../../../../src/modules/meeting-assistant/releases.settings';
import {
  deleteReleaseZip,
  saveReleaseZip,
  streamReleaseZip,
} from '../../../../src/modules/meeting-assistant/releases.store';
import type { LeanRelease } from '../../../../src/modules/meeting-assistant/releases.service';
import { MaReleaseSettingsModel } from '../../../../src/modules/meeting-assistant/models';
import { env } from '../../../../src/config/env';
import { slackNotifier } from '../../../../src/utils/slack';
import { logger } from '../../../../src/utils/logger';
import { runAsPlatform } from '../../../../src/lib/tenant';

let post: jest.SpyInstance;
let configured: jest.SpyInstance;
let readSettings: jest.SpyInstance;

const release = (patch: Partial<LeanRelease> = {}) =>
  ({ version: '1.4.0', channel: 'STABLE', releaseNotes: '', ...patch }) as LeanRelease;

const setSettings = (fields: Record<string, unknown>) =>
  runAsPlatform(() =>
    MaReleaseSettingsModel.updateOne({ key: 'global' }, { $set: fields }, { upsert: true }),
  );

/** Lets a fire-and-forget post finish: the settings read, Slack's check, then the post. */
async function settled(): Promise<void> {
  await Promise.all(readSettings.mock.results.map((result) => result.value));
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

beforeEach(async () => {
  readSettings = jest.spyOn(releaseSettings, 'getReleaseSettings');
  configured = jest.spyOn(slackNotifier, 'isConfigured').mockResolvedValue(true);
  post = jest.spyOn(slackNotifier, 'post').mockResolvedValue({ channel: 'C1', ts: '1.0' });
  await setSettings({ slackChannelId: 'C1', notifyOnNewBuild: true });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('announcePublished', () => {
  it('posts the version, channel, quoted notes and the download page', async () => {
    announcePublished(release({ releaseNotes: 'Faster transcripts\nFewer reminders' }));
    await settled();

    expect(post).toHaveBeenCalledWith(
      'C1',
      ':rocket: *Exyconn Meeting Assistant 1.4.0* is ready to install (STABLE channel).' +
        '\n>Faster transcripts\n>Fewer reminders' +
        `\nDownload it in the portal: ${env.meetAssistant.portalUrl}/me/meetings/extension`,
    );
  });

  it('quotes no notes when there are none, and cuts long ones short', async () => {
    announcePublished(release({ releaseNotes: '   ' }));
    announcePublished(release({ version: '1.5.0', releaseNotes: 'x'.repeat(600) }));
    await settled();

    expect(post).toHaveBeenCalledTimes(2);
    const texts = post.mock.calls.map(([, text]) => text as string);
    expect(texts.find((text) => text.includes('1.4.0'))).not.toContain('\n>');
    expect(texts.find((text) => text.includes('1.5.0'))).toContain(`\n>${'x'.repeat(500)}…\n`);
  });

  it('posts nowhere without a channel or without Slack', async () => {
    await setSettings({ slackChannelId: '' });
    announcePublished(release());
    await settled();
    await setSettings({ slackChannelId: 'C1' });
    configured.mockResolvedValue(false);
    announcePublished(release());
    await settled();

    expect(post).not.toHaveBeenCalled();
    expect(configured).toHaveBeenCalledTimes(1);
  });

  it('logs a Slack failure instead of failing the approval', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('channel_not_found');
    post.mockRejectedValue(failure);

    expect(() => announcePublished(release())).not.toThrow();
    await settled();

    expect(warn).toHaveBeenCalledWith(
      { err: failure, version: '1.4.0' },
      'Slack release announcement failed',
    );
  });
});

describe('announceNewBuild', () => {
  it('tells the channel a build waits for approval, when asked to', async () => {
    announceNewBuild(release({ version: '2.0.0', releaseNotes: 'New look' }));
    await settled();

    expect(post).toHaveBeenCalledWith(
      'C1',
      ':package: Meeting Assistant build *2.0.0* arrived and is waiting for approval.\n>New look' +
        `\nReview it: ${env.meetAssistant.releasesUrl}`,
    );
  });

  it('stays quiet when the settings do not ask for it', async () => {
    await setSettings({ notifyOnNewBuild: false });
    announceNewBuild(release());
    await settled();

    expect(post).not.toHaveBeenCalled();
    expect(configured).not.toHaveBeenCalled();
  });

  it('logs a failure to post', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('Slack down');
    configured.mockRejectedValue(failure);

    announceNewBuild(release());
    await settled();

    expect(warn).toHaveBeenCalledWith(
      { err: failure, version: '1.4.0' },
      'Slack new-build post failed',
    );
  });
});

describe('the build store', () => {
  /** A response stand-in that keeps what is streamed into it. */
  function sink() {
    const chunks: Buffer[] = [];
    const out = new Writable({
      write(chunk: Buffer, _encoding, done) {
        chunks.push(chunk);
        done();
      },
    });
    return { out, bytes: () => Buffer.concat(chunks) };
  }

  it('keeps a ZIP with its metadata and streams it back byte for byte', async () => {
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]);
    const fileId = await saveReleaseZip('meet-1.4.0.zip', zip, {
      version: '1.4.0',
      sha256: 'a'.repeat(64),
    });
    const { out, bytes } = sink();

    await streamReleaseZip(fileId, out);

    expect(fileId).toBeInstanceOf(Types.ObjectId);
    expect(bytes()).toEqual(zip);
  });

  it('forgets a deleted ZIP, and fails to stream an unknown one', async () => {
    const fileId = await saveReleaseZip('meet.zip', Buffer.from('zip'), {
      version: '1.0.0',
      sha256: 'b'.repeat(64),
    });

    await deleteReleaseZip(fileId);

    await expect(streamReleaseZip(fileId, sink().out)).rejects.toThrow(
      `The release ZIP ${fileId.toHexString()} is missing from the store.`,
    );
    await expect(deleteReleaseZip(new Types.ObjectId())).rejects.toThrow();
  });
});
