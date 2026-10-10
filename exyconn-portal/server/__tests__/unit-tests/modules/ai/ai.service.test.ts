import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import {
  defaultAiModel,
  enqueueAiJob,
  executeAiJob,
  listAiModels,
  runAiJobNow,
} from '../../../../src/modules/ai/ai.service';
import { AiJobModel } from '../../../../src/modules/ai/ai.model';
import { AiModelPriceModel } from '../../../../src/modules/ai/ai-price.model';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import { openAiClient } from '../../../../src/utils/openai';
import { logger } from '../../../../src/utils/logger';

jest.mock('../../../../src/utils/openai', () => ({
  openAiClient: { complete: jest.fn(), listModels: jest.fn() },
}));

const complete = openAiClient.complete as jest.Mock;
const listModels = openAiClient.listModels as jest.Mock;
const actor = { id: 'user-1', name: 'ai@exyconn.com' };

const seedConfig = (isActive = true) =>
  OpenAiConfigModel.create({
    label: 'Primary',
    apiKey: randomUUID(),
    defaultModel: 'gpt-4o-mini',
    isActive,
  });

const seedJob = (over: Record<string, unknown> = {}) =>
  AiJobModel.create({ name: 'Summarise', model: 'gpt-4o-mini', prompt: 'Say hello', ...over });

const usage = { text: 'Hi', promptTokens: 1000, completionTokens: 1000, totalTokens: 2000 };

beforeEach(() => jest.spyOn(logger, 'error').mockImplementation(() => undefined));
afterEach(() => jest.restoreAllMocks());

describe('the OpenAI key', () => {
  it('is required, and an inactive key does not count', async () => {
    await seedConfig(false);

    await expect(listAiModels()).rejects.toThrow(/No active OpenAI key/);
    await expect(defaultAiModel()).rejects.toThrow(/Tech › Environment Variables/);
  });

  it('lists the account’s models on the active key and opens on its default model', async () => {
    const config = await seedConfig();
    listModels.mockResolvedValue(['gpt-4o']);

    await expect(listAiModels()).resolves.toEqual(['gpt-4o']);
    expect(listModels).toHaveBeenCalledWith(config.apiKey);
    await expect(defaultAiModel()).resolves.toBe('gpt-4o-mini');
  });
});

describe('executeAiJob', () => {
  it('stores the answer, the tokens and the priced cost, clearing an earlier failure', async () => {
    await seedConfig();
    await AiModelPriceModel.create({ model: 'gpt-4o-mini', inputPer1kUsd: 0.5, outputPer1kUsd: 1 });
    const job = await seedJob({ status: 'FAILED', error: 'earlier', queuedAt: new Date() });
    complete.mockResolvedValue(usage);

    const result = await executeAiJob(job);

    expect(result).toMatchObject({
      status: 'SUCCEEDED',
      response: 'Hi',
      error: '',
      promptTokens: 1000,
      completionTokens: 1000,
      totalTokens: 2000,
      costUsd: 1.5,
      queuedAt: null,
    });
    expect(result.ranAt).toBeInstanceOf(Date);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('records a failure that is not an Error with a plain reason', async () => {
    await seedConfig();
    const job = await seedJob();
    complete.mockRejectedValue('socket hang up');

    const result = await executeAiJob(job);

    expect(result).toMatchObject({ status: 'FAILED', response: '', error: 'The run failed.' });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: job._id.toHexString() }),
      'AI job failed',
    );
  });

  it('touches nothing when no key is active', async () => {
    const job = await seedJob();

    await expect(executeAiJob(job)).rejects.toThrow(/No active OpenAI key/);
    expect((await AiJobModel.findById(job._id).lean())?.status).toBe('QUEUED');
  });
});

describe('runAiJobNow', () => {
  it('runs a job start to finish in the caller’s request', async () => {
    await seedConfig();
    const job = await seedJob();
    complete.mockResolvedValue(usage);

    await expect(runAiJobNow(job._id.toHexString())).resolves.toMatchObject({
      status: 'SUCCEEDED',
    });
  });

  it('reports a job that does not exist', async () => {
    await expect(runAiJobNow(new Types.ObjectId().toHexString())).rejects.toThrow(
      'AI job not found',
    );
  });
});

describe('enqueueAiJob', () => {
  it('reports a job that does not exist', async () => {
    await expect(enqueueAiJob(new Types.ObjectId().toHexString(), actor)).rejects.toThrow(
      'AI job not found',
    );
  });

  it('refuses a job that is already running', async () => {
    await seedConfig();
    const job = await seedJob({ status: 'RUNNING' });

    await expect(enqueueAiJob(job._id.toHexString(), actor)).rejects.toThrow(
      'This job is already running.',
    );
  });

  it('queues a saved draft and re-queues a failed run, clearing what it said before', async () => {
    await seedConfig();
    const draft = await seedJob();
    const failed = await seedJob({ status: 'FAILED', error: 'boom', response: 'partial' });

    const queuedDraft = await enqueueAiJob(draft._id.toHexString(), actor);
    const requeued = await enqueueAiJob(failed._id.toHexString(), actor);

    expect(queuedDraft.queuedAt).toBeInstanceOf(Date);
    expect(requeued).toMatchObject({
      status: 'QUEUED',
      error: '',
      response: '',
      createdById: 'user-1',
      createdByName: 'ai@exyconn.com',
    });
    expect(complete).not.toHaveBeenCalled();
  });

  it('refuses to queue without a key, leaving the job as it was', async () => {
    const job = await seedJob();

    await expect(enqueueAiJob(job._id.toHexString(), actor)).rejects.toThrow(
      /No active OpenAI key/,
    );
    expect((await AiJobModel.findById(job._id).lean())?.queuedAt).toBeNull();
  });
});
