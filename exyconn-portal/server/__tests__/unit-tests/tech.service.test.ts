import { techService } from '../../src/modules/tech/tech.service';
import { EmailConfigModel } from '../../src/modules/tech/email-config.model';
import { ImageConfigModel } from '../../src/modules/tech/image-config.model';
import { SlackConfigModel } from '../../src/modules/tech/slack-config.model';
import { GithubConfigModel } from '../../src/modules/tech/github-config.model';

const emailInput = {
  label: 'Primary',
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  username: 'user@example.com',
  password: 'secret',
  fromAddress: 'Portal <no-reply@example.com>',
};

const imageInput = {
  label: 'Primary',
  provider: 'imagekit',
  publicKey: 'pub',
  privateKey: 'priv',
  urlEndpoint: 'https://ik.imagekit.io/demo',
};

const slackInput = {
  label: 'Primary',
  botToken: 'xoxb-test-token',
  defaultChannel: '#releases',
};

const githubInput = {
  label: 'Primary',
  owner: 'exyconn',
  repo: 'exyconn-all',
  token: 'github_pat_test',
};

describe('TechService', () => {
  it('keeps a single active email config', async () => {
    const first = await techService.createEmailConfig({ ...emailInput, isActive: true });
    const second = await techService.createEmailConfig({
      ...emailInput,
      label: 'Backup',
      isActive: true,
    });

    const active = await EmailConfigModel.find({ isActive: true }).lean();
    expect(active).toHaveLength(1);
    expect(active[0]._id.toString()).toBe(second._id.toString());
    expect(first.label).toBe('Primary');
  });

  it('deactivates peers when an email config is updated to active', async () => {
    const a = await techService.createEmailConfig({ ...emailInput, isActive: true });
    const b = await techService.createEmailConfig({ ...emailInput, label: 'B', isActive: false });

    await techService.updateEmailConfig(String(b._id), {
      ...emailInput,
      label: 'B',
      isActive: true,
    });

    const refreshedA = await EmailConfigModel.findById(a._id).lean();
    expect(refreshedA?.isActive).toBe(false);
  });

  it('keeps a single active image config', async () => {
    await techService.createImageConfig({ ...imageInput, isActive: true });
    await techService.createImageConfig({ ...imageInput, label: 'Backup', isActive: true });

    const active = await ImageConfigModel.find({ isActive: true }).lean();
    expect(active).toHaveLength(1);
    expect(active[0].label).toBe('Backup');
  });

  it('keeps a single active Slack config', async () => {
    await techService.createSlackConfig({ ...slackInput, isActive: true });
    await techService.createSlackConfig({ ...slackInput, label: 'Backup', isActive: true });

    const active = await SlackConfigModel.find({ isActive: true }).lean();
    expect(active).toHaveLength(1);
    expect(active[0].label).toBe('Backup');
  });

  it('deactivates peers when a Slack config is updated to active', async () => {
    const a = await techService.createSlackConfig({ ...slackInput, isActive: true });
    const b = await techService.createSlackConfig({ ...slackInput, label: 'B', isActive: false });

    await techService.updateSlackConfig(String(b._id), {
      ...slackInput,
      label: 'B',
      isActive: true,
    });

    const refreshedA = await SlackConfigModel.findById(a._id).lean();
    expect(refreshedA?.isActive).toBe(false);
  });

  it('rejects a test message for an unknown Slack config', async () => {
    await expect(
      techService.sendTestSlackMessage('64b7f1c2e4b0a1a2b3c4d5e6', '#releases'),
    ).rejects.toThrow();
  });

  it('keeps a single active GitHub config', async () => {
    await techService.createGithubConfig({ ...githubInput, isActive: true });
    await techService.createGithubConfig({ ...githubInput, label: 'Backup', isActive: true });

    const active = await GithubConfigModel.find({ isActive: true }).lean();
    expect(active).toHaveLength(1);
    expect(active[0].label).toBe('Backup');
  });

  it('starts empty and remembers the Slack channels a build is posted to', async () => {
    expect((await techService.trackerBuildSettings()).slackChannels).toEqual([]);

    await techService.saveTrackerBuildSettings(['C001', 'C002']);

    expect((await techService.trackerBuildSettings()).slackChannels).toEqual(['C001', 'C002']);
  });

  it('keeps one settings row however often it is saved', async () => {
    await techService.saveTrackerBuildSettings(['C001']);
    await techService.saveTrackerBuildSettings(['C002']);

    const settings = await techService.trackerBuildSettings();
    expect(settings.slackChannels).toEqual(['C002']);
  });

  it('refuses a build with no platform chosen', async () => {
    await expect(techService.startTrackerBuild([], 'main')).rejects.toThrow();
  });
});
