import { randomUUID } from 'node:crypto';
import { startAiWorker } from '../../../../src/modules/ai/ai.worker';
import { AiJobModel } from '../../../../src/modules/ai/ai.model';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import * as heartbeat from '../../../../src/utils/jobHeartbeat';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { openAiClient } from '../../../../src/utils/openai';
import { logger } from '../../../../src/utils/logger';

jest.mock('../../../../src/utils/openai', () => ({
  openAiClient: { complete: jest.fn(), listModels: jest.fn() },
}));

const complete = openAiClient.complete as jest.Mock;

/** Resolves with the summary the worker's next tick reports. */
function nextHeartbeat(): Promise<string> {
  return new Promise((resolve) => {
    jest
      .spyOn(heartbeat, 'recordJobRun')
      .mockImplementationOnce((_key, summary) => resolve(summary));
  });
}

/** Starts the worker with its timer captured, so the test can stop it again. */
function start(): void {
  const interval = jest.spyOn(globalThis, 'setInterval');
  startAiWorker();
  const tickTimer = interval.mock.calls.findIndex(([, ms]) => ms === 3_000);
  clearInterval(interval.mock.results[tickTimer].value);
}

beforeEach(() => {
  jest.spyOn(logger, 'info').mockImplementation(() => undefined);
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('the AI queue as a registered background job', () => {
  it('runs once and reports that there was nothing to do', async () => {
    const job = findBackgroundJob(heartbeat.JOB_KEYS.aiQueue);

    expect(job?.label).toBe('AI job queue');
    await expect(job?.runOnce()).resolves.toBe(false);
  });
});

describe('startAiWorker', () => {
  it('ticks at once, reports an empty queue and announces itself', async () => {
    const reported = nextHeartbeat();

    start();

    await expect(reported).resolves.toBe('Queue empty');
    expect(logger.info).toHaveBeenCalledWith('AI job worker started');
    expect(globalThis.setInterval).toHaveBeenCalledWith(expect.any(Function), 3_000);
  });

  it('runs a job queued inside an active company and counts it', async () => {
    const organization = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Acme', slug: 'acme', currency: 'USD' }),
    );
    await OpenAiConfigModel.create({
      label: 'Primary',
      apiKey: randomUUID(),
      defaultModel: 'gpt-4o-mini',
      isActive: true,
    });
    const job = await runForOrganization(String(organization._id), () =>
      AiJobModel.create({
        name: 'Queued',
        model: 'gpt-4o-mini',
        prompt: 'Hi',
        queuedAt: new Date(),
      }),
    );
    complete.mockResolvedValue({
      text: 'Hello',
      promptTokens: 1,
      completionTokens: 1,
      totalTokens: 2,
    });
    const reported = nextHeartbeat();

    start();

    await expect(reported).resolves.toBe('Ran 1 job(s)');
    const saved = await runAsPlatform(() => AiJobModel.findById(job._id).lean());
    expect(saved).toMatchObject({ status: 'SUCCEEDED', response: 'Hello' });
  });

  it('logs a tick that fails instead of letting it escape', async () => {
    jest.spyOn(heartbeat, 'recordJobRun').mockImplementationOnce(() => {
      throw new Error('heartbeat down');
    });
    const logged = new Promise((resolve) => {
      jest.spyOn(logger, 'error').mockImplementationOnce((...args: unknown[]) => resolve(args));
    });

    start();

    await expect(logged).resolves.toEqual([expect.any(Error), 'AI queue tick failed']);
  });
});
