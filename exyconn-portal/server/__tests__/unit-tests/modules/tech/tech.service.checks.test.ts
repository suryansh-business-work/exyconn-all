import { techService } from '../../../../src/modules/tech/tech.service';
import { mailer } from '../../../../src/utils/mailer';
import { imageUploader } from '../../../../src/utils/imagekit';
import { slackNotifier } from '../../../../src/utils/slack';
import { githubActions } from '../../../../src/utils/github';
import { pexelsClient } from '../../../../src/utils/pexels';
import { openAiClient } from '../../../../src/utils/openai';
import { codeOf } from '../codeOf';
import {
  UNKNOWN_ID,
  emailInput,
  githubInput,
  imageInput,
  openAiInput,
  pexelsInput,
  slackInput,
} from './tech.fixtures';

// The shared setup stubs the mailer without a test-email sender; this suite needs one.
jest.mock('../../../../src/utils/mailer', () => ({
  mailer: { sendTestEmail: jest.fn().mockResolvedValue(undefined) },
}));

const HOSTED_URL = 'https://ik.imagekit.io/demo/test.png';

/** A config's "check it works" button: it reaches the provider through THAT config only. */
interface CheckCase {
  name: string;
  missing: string;
  create: () => Promise<{ _id: unknown }>;
  run: (id: string) => Promise<unknown>;
  /** The provider call the check makes, already stubbed by beforeEach. */
  provider: () => { mock: { calls: unknown[][] } };
  /** What the provider receives after the config itself. */
  extra: unknown[];
  result: unknown;
}

const cases: CheckCase[] = [
  {
    name: 'email',
    missing: 'Email config',
    create: () => techService.createEmailConfig(emailInput({ label: 'Mail' })),
    run: (id) => techService.sendTestEmail(id, 'ops@example.com'),
    provider: () => jest.mocked(mailer.sendTestEmail),
    extra: ['ops@example.com'],
    result: true,
  },
  {
    name: 'image',
    missing: 'Image config',
    create: () => techService.createImageConfig(imageInput({ label: 'Images' })),
    run: (id) => techService.testImageUpload(id, 'data:image/png;base64,AAAA', 'test.png'),
    provider: () => jest.mocked(imageUploader.uploadTest),
    extra: ['data:image/png;base64,AAAA', 'test.png'],
    result: HOSTED_URL,
  },
  {
    name: 'Slack',
    missing: 'Slack config',
    create: () => techService.createSlackConfig(slackInput({ label: 'Workspace' })),
    run: (id) => techService.sendTestSlackMessage(id, '#ops'),
    provider: () => jest.mocked(slackNotifier.sendTestMessage),
    extra: ['#ops'],
    result: true,
  },
  {
    name: 'GitHub',
    missing: 'GitHub config',
    create: () => techService.createGithubConfig(githubInput({ label: 'Repo' })),
    run: (id) => techService.testGithubConnection(id),
    provider: () => jest.mocked(githubActions.verify),
    extra: [],
    result: true,
  },
  {
    name: 'Pexels',
    missing: 'Pexels config',
    create: () => techService.createPexelsConfig(pexelsInput({ label: 'Stock' })),
    run: (id) => techService.testPexelsConnection(id),
    provider: () => jest.mocked(pexelsClient.verify),
    extra: [],
    result: true,
  },
  {
    name: 'OpenAI',
    missing: 'OpenAI config',
    create: () => techService.createOpenAiConfig(openAiInput({ label: 'Models' })),
    run: (id) => techService.testOpenAiConnection(id),
    provider: () => jest.mocked(openAiClient.verify),
    extra: [],
    result: true,
  },
];

beforeEach(() => {
  jest.spyOn(imageUploader, 'uploadTest').mockResolvedValue(HOSTED_URL);
  jest.spyOn(slackNotifier, 'sendTestMessage').mockResolvedValue();
  jest.spyOn(githubActions, 'verify').mockResolvedValue();
  jest.spyOn(pexelsClient, 'verify').mockResolvedValue();
  jest.spyOn(openAiClient, 'verify').mockResolvedValue();
});

describe.each(cases)('checking the $name config', (c) => {
  it('goes through the chosen config and reports the result', async () => {
    await c.create();
    const chosen = await c.create();

    await expect(c.run(String(chosen._id))).resolves.toBe(c.result);

    const { calls } = c.provider().mock;
    expect(calls).toHaveLength(1);
    const [config, ...rest] = calls[0] as [{ _id: unknown }, ...unknown[]];
    expect(String(config._id)).toBe(String(chosen._id));
    expect(rest).toEqual(c.extra);
  });

  it('reaches no provider for a config that is not there', async () => {
    await expect(c.run(UNKNOWN_ID)).rejects.toThrow(`${c.missing} not found`);
    expect(await codeOf(c.run(UNKNOWN_ID))).toBe('NOT_FOUND');
    expect(c.provider().mock.calls).toHaveLength(0);
  });
});
