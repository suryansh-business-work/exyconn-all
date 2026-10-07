import { techService } from '../../../../src/modules/tech/tech.service';
import { SlackConfigModel } from '../../../../src/modules/tech/slack-config.model';
import { TrackerBuildSettingsModel } from '../../../../src/modules/tech/tracker-build-settings.model';
import { githubActions, type WorkflowRun } from '../../../../src/utils/github';
import { slackNotifier, type SlackChannel } from '../../../../src/utils/slack';
import { pexelsClient, type PexelsMedia } from '../../../../src/utils/pexels';
import { codeOf } from '../codeOf';
import { credential, slackInput } from './tech.fixtures';

describe('tracker builds', () => {
  it('lists the last ten runs of the build workflow', async () => {
    const runs = [{ id: '42' }] as unknown as WorkflowRun[];
    const list = jest.spyOn(githubActions, 'listTrackerRuns').mockResolvedValue(runs);

    await expect(techService.listTrackerBuilds()).resolves.toBe(runs);
    expect(list).toHaveBeenCalledWith(10);
  });

  it('creates the settings row once, empty, however many times it is read', async () => {
    const first = await techService.trackerBuildSettings();
    const second = await techService.trackerBuildSettings();

    expect(first).toMatchObject({ key: 'default', slackChannels: [], statusAlertChannels: [] });
    expect(String(second._id)).toBe(String(first._id));
    expect(await TrackerBuildSettingsModel.countDocuments()).toBe(1);
  });

  it('saves the status alert channels when they are sent, and keeps them when they are not', async () => {
    const saved = await techService.saveTrackerBuildSettings(['C001'], ['A001']);
    expect(saved).toMatchObject({ slackChannels: ['C001'], statusAlertChannels: ['A001'] });

    await techService.saveTrackerBuildSettings(['C002']);
    await techService.saveTrackerBuildSettings(['C003'], null);

    const settings = await techService.trackerBuildSettings();
    expect(settings).toMatchObject({ slackChannels: ['C003'], statusAlertChannels: ['A001'] });
  });

  it('starts a build with no Slack channels before any are saved', async () => {
    const dispatch = jest.spyOn(githubActions, 'dispatchTrackerBuild').mockResolvedValue();

    await expect(techService.startTrackerBuild(['MACOS', 'LINUX'], 'staging')).resolves.toBe(true);

    expect(dispatch).toHaveBeenCalledWith('staging', {
      platforms: 'macos,linux',
      slack_channels: '',
    });
  });

  it('refuses a build with no platform and asks GitHub for nothing', async () => {
    const dispatch = jest.spyOn(githubActions, 'dispatchTrackerBuild').mockResolvedValue();

    const refusal = techService.startTrackerBuild([], 'main');

    await expect(refusal).rejects.toThrow('Choose at least one platform to build.');
    expect(await codeOf(techService.startTrackerBuild([], 'main'))).toBe('BAD_USER_INPUT');
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('the Slack signing secret', () => {
  it('is kept when an edit sends a blank one and replaced when it sends a new one', async () => {
    const signingSecret = credential('signing');
    const config = await techService.createSlackConfig(slackInput({ signingSecret }));

    await techService.updateSlackConfig(String(config._id), slackInput({ signingSecret: ' ' }));
    expect((await SlackConfigModel.findById(config._id).lean())?.signingSecret).toBe(signingSecret);

    const rotated = credential('signing-rotated');
    await techService.updateSlackConfig(String(config._id), slackInput({ signingSecret: rotated }));
    expect((await SlackConfigModel.findById(config._id).lean())?.signingSecret).toBe(rotated);
  });

  it('is cleared when an edit sends null on purpose', async () => {
    const config = await techService.createSlackConfig(
      slackInput({ signingSecret: credential('signing') }),
    );

    const updated = await techService.updateSlackConfig(
      String(config._id),
      slackInput({ signingSecret: null }),
    );

    expect(updated.signingSecret ?? null).toBeNull();
  });
});

describe('the integrations the screens read through', () => {
  it('lists the channels the active Slack bot can see', async () => {
    const channels: SlackChannel[] = [
      { id: 'C001', name: 'general', isPrivate: false, isMember: true },
    ];
    jest.spyOn(slackNotifier, 'listChannels').mockResolvedValue(channels);

    await expect(techService.listSlackChannels()).resolves.toBe(channels);
  });

  it('searches Pexels photos and videos with the term, page and filters it was given', async () => {
    const media = [
      { id: '1', url: 'https://images.pexels.com/1.jpeg' },
    ] as unknown as PexelsMedia[];
    const photos = jest.spyOn(pexelsClient, 'searchPhotos').mockResolvedValue(media);
    const videos = jest.spyOn(pexelsClient, 'searchVideos').mockResolvedValue([]);

    await expect(techService.searchPexelsPhotos('office', 2, {})).resolves.toBe(media);
    await expect(techService.searchPexelsVideos('ocean', 3, {})).resolves.toEqual([]);

    expect(photos).toHaveBeenCalledWith('office', 2, {});
    expect(videos).toHaveBeenCalledWith('ocean', 3, {});
  });
});
