import { aiCustomResolvers } from '../../src/modules/ai/ai.resolvers';
import { AiJobModel } from '../../src/modules/ai/ai.model';
import { PromptModel } from '../../src/modules/ai/prompt.model';
import { AiModelPriceModel } from '../../src/modules/ai/ai-price.model';
import { AiSpendLimitModel } from '../../src/modules/ai/ai-spend-limit.model';
import { computeCostUsd } from '../../src/modules/ai/ai.pricing';
import { extractMergeFields, renderMergeFields } from '../../src/modules/ai/ai.mergeFields';
import { runNextAiJob } from '../../src/modules/ai/ai.worker';
import { OpenAiConfigModel } from '../../src/modules/tech/openai-config.model';
import { openAiClient } from '../../src/utils/openai';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

jest.mock('../../src/utils/openai', () => ({
  openAiClient: { complete: jest.fn(), listModels: jest.fn() },
}));

const complete = openAiClient.complete as jest.Mock;
const listModels = openAiClient.listModels as jest.Mock;

const asAi: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.AI], email: 'ai@exyconn.com' },
};

const seedConfig = () =>
  OpenAiConfigModel.create({
    label: 'Primary',
    apiKey: process.env.TEST_OPENAI_KEY ?? 'test-key',
    defaultModel: 'gpt-4o-mini',
    isActive: true,
  });

const seedJob = () =>
  AiJobModel.create({ name: 'Summarise', model: 'gpt-4o-mini', prompt: 'Say hello' });

const queue = (id: string) => aiCustomResolvers.Mutation.runAiJob(null, { id }, asAi);

/**
 * Queues a job and drains the queue once, with no timers involved: the worker's tick is a
 * plain function, so a test never has to wait on the interval that calls it in production.
 */
const run = async (id: string) => {
  const queued = await queue(id);
  await runNextAiJob();
  return queued;
};

const seedPrice = (model: string, inputPer1kUsd: number, outputPer1kUsd: number) =>
  AiModelPriceModel.create({ model, inputPer1kUsd, outputPer1kUsd, active: true });

const seedFinishedJob = (costUsd: number, createdById: string) =>
  AiJobModel.create({
    name: 'Earlier run',
    model: 'gpt-4o-mini',
    prompt: 'Anything',
    status: 'SUCCEEDED',
    costUsd,
    createdById,
    ranAt: new Date(),
  });

const setLimits = (monthlyUsdCap: number, perUserDailyUsdCap: number) =>
  AiSpendLimitModel.create({
    key: 'global',
    monthlyUsdCap,
    perUserDailyUsdCap,
    enabled: true,
  });

describe('Running an AI job', () => {
  it('stores the answer and the tokens it cost', async () => {
    await seedConfig();
    const job = await seedJob();
    complete.mockResolvedValue({
      text: 'Hello there',
      promptTokens: 8,
      completionTokens: 3,
      totalTokens: 11,
    });

    await run(String(job._id));

    const saved = await AiJobModel.findById(job._id).lean();
    expect(saved?.status).toBe('SUCCEEDED');
    expect(saved?.response).toBe('Hello there');
    expect(saved?.totalTokens).toBe(11);
    expect(saved?.ranAt).toBeInstanceOf(Date);
  });

  it('sends the job on the key from the active config', async () => {
    await seedConfig();
    const job = await seedJob();
    complete.mockResolvedValue({
      text: 'ok',
      promptTokens: 1,
      completionTokens: 1,
      totalTokens: 2,
    });

    await run(String(job._id));

    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini', prompt: 'Say hello' }),
    );
  });

  it('keeps the failure on the job instead of losing it', async () => {
    await seedConfig();
    const job = await seedJob();
    complete.mockRejectedValue(new Error('OpenAI /v1/chat/completions failed (401)'));

    await run(String(job._id));

    const saved = await AiJobModel.findById(job._id).lean();
    expect(saved?.status).toBe('FAILED');
    expect(saved?.error).toContain('401');
    expect(saved?.response).toBe('');
  });

  it('refuses to run when no OpenAI key is active', async () => {
    const job = await seedJob();

    await expect(run(String(job._id))).rejects.toThrow(/no active openai key/i);
    expect(complete).not.toHaveBeenCalled();
  });

  it('queues the job and answers before it has run', async () => {
    await seedConfig();
    const job = await seedJob();
    complete.mockResolvedValue({
      text: 'Later',
      promptTokens: 1,
      completionTokens: 1,
      totalTokens: 2,
    });

    const queued = (await queue(String(job._id))) as { status: string };

    expect(queued.status).toBe('QUEUED');
    expect(complete).not.toHaveBeenCalled();
    expect((await AiJobModel.findById(job._id).lean())?.queuedAt).toBeInstanceOf(Date);
  });

  it('refuses to queue the same job twice', async () => {
    await seedConfig();
    const job = await seedJob();
    await queue(String(job._id));

    await expect(queue(String(job._id))).rejects.toThrow(/already waiting/i);
  });

  it('leaves a job nobody queued alone', async () => {
    await seedConfig();
    await seedJob();

    expect(await runNextAiJob()).toBe(false);
    expect(complete).not.toHaveBeenCalled();
  });

  it('attributes the run to the caller from their token', async () => {
    await seedConfig();
    const job = await seedJob();
    complete.mockResolvedValue({
      text: 'ok',
      promptTokens: 1,
      completionTokens: 1,
      totalTokens: 2,
    });

    await run(String(job._id));

    const saved = await AiJobModel.findById(job._id).lean();
    expect(saved?.createdById).toBe('user-1');
    expect(saved?.createdByName).toBe('ai@exyconn.com');
  });

  it('runs a prompt-library entry as its own job', async () => {
    await seedConfig();
    const prompt = await PromptModel.create({
      title: 'Weekly digest',
      category: 'WRITING',
      content: 'Summarise the week',
    });
    complete.mockResolvedValue({
      text: 'Done',
      promptTokens: 4,
      completionTokens: 2,
      totalTokens: 6,
    });

    await aiCustomResolvers.Mutation.runPrompt(
      null,
      { id: String(prompt._id), model: 'gpt-4o-mini' },
      asAi,
    );
    await runNextAiJob();

    const saved = await AiJobModel.findOne({ promptId: String(prompt._id) }).lean();
    expect(saved?.name).toBe('Weekly digest');
    expect(saved?.prompt).toBe('Summarise the week');
    expect(saved?.status).toBe('SUCCEEDED');
  });

  it('offers the account’s own models, opening on the configured default', async () => {
    await seedConfig();
    listModels.mockResolvedValue(['gpt-4o', 'gpt-4o-mini']);

    const options = await aiCustomResolvers.Query.aiModels(null, null, asAi);

    expect(options).toEqual({ models: ['gpt-4o', 'gpt-4o-mini'], defaultModel: 'gpt-4o-mini' });
  });
});

describe('What a run costs', () => {
  it('prices a run from the model’s price row', () => {
    const cost = computeCostUsd(
      { promptTokens: 8, completionTokens: 3 },
      { inputPer1kUsd: 1, outputPer1kUsd: 2 },
    );

    expect(cost).toBeCloseTo(0.014, 10);
  });

  it('costs a model with no price on file nothing, rather than a guess', () => {
    expect(computeCostUsd({ promptTokens: 5000, completionTokens: 5000 }, null)).toBe(0);
  });

  it('stores the cost on the job when the model is priced', async () => {
    await seedConfig();
    await seedPrice('gpt-4o-mini', 1, 2);
    const job = await seedJob();
    complete.mockResolvedValue({
      text: 'Hello',
      promptTokens: 8,
      completionTokens: 3,
      totalTokens: 11,
    });

    await run(String(job._id));

    expect((await AiJobModel.findById(job._id).lean())?.costUsd).toBeCloseTo(0.014, 10);
  });

  it('stores zero when the model has no price row', async () => {
    await seedConfig();
    const job = await seedJob();
    complete.mockResolvedValue({
      text: 'Hello',
      promptTokens: 8000,
      completionTokens: 3000,
      totalTokens: 11000,
    });

    await run(String(job._id));

    expect((await AiJobModel.findById(job._id).lean())?.costUsd).toBe(0);
  });

  it('adds up what was spent, by person and by model', async () => {
    await seedFinishedJob(0.02, 'user-1');
    await AiJobModel.create({
      name: 'Other',
      model: 'gpt-4o',
      prompt: 'x',
      status: 'SUCCEEDED',
      costUsd: 0.05,
      createdById: 'user-2',
      createdByName: 'other@exyconn.com',
      ranAt: new Date(),
    });

    const summary = await aiCustomResolvers.Query.aiSpendSummary(
      null,
      { from: new Date(Date.now() - 60_000), to: new Date(Date.now() + 60_000) },
      asAi,
    );

    expect(summary.totalUsd).toBeCloseTo(0.07, 10);
    expect(summary.byModel.map((row) => row.model)).toEqual(['gpt-4o', 'gpt-4o-mini']);
    expect(summary.byUser).toHaveLength(2);
  });
});

describe('AI spend caps', () => {
  it('refuses once the monthly cap is used up, and says by how much', async () => {
    await seedConfig();
    await setLimits(0.01, 0);
    await seedFinishedJob(0.02, 'someone-else');
    const job = await seedJob();

    await expect(queue(String(job._id))).rejects.toThrow(
      /monthly AI budget of \$0\.01 is used up — \$0\.02 spent/i,
    );
    expect(complete).not.toHaveBeenCalled();
  });

  it('refuses once the caller’s own daily cap is used up', async () => {
    await seedConfig();
    await setLimits(0, 0.01);
    await seedFinishedJob(0.02, 'user-1');
    const job = await seedJob();

    await expect(queue(String(job._id))).rejects.toThrow(
      /daily AI budget of \$0\.01 is used up — \$0\.02 spent today/i,
    );
  });

  it('leaves somebody else’s spending out of the caller’s daily cap', async () => {
    await seedConfig();
    await setLimits(0, 0.01);
    await seedFinishedJob(0.02, 'someone-else');
    const job = await seedJob();

    await expect(queue(String(job._id))).resolves.toMatchObject({ status: 'QUEUED' });
  });

  it('ignores the caps while they are switched off', async () => {
    await seedConfig();
    await AiSpendLimitModel.create({
      key: 'global',
      monthlyUsdCap: 0.01,
      perUserDailyUsdCap: 0.01,
      enabled: false,
    });
    await seedFinishedJob(9, 'user-1');
    const job = await seedJob();

    await expect(queue(String(job._id))).resolves.toMatchObject({ status: 'QUEUED' });
  });
});

describe('Prompt variables', () => {
  it('finds each placeholder once, in the order it appears', () => {
    expect(extractMergeFields('Hi {{name}}, about {{topic}} — thanks {{ name }}')).toEqual([
      'name',
      'topic',
    ]);
  });

  it('fills what it is given and renders the rest as nothing', () => {
    expect(renderMergeFields('Hi {{name}}, about {{topic}}.', { name: 'Asha' })).toBe(
      'Hi Asha, about .',
    );
  });

  it('interpolates values rather than executing anything', () => {
    expect(renderMergeFields('{{a}}', { a: '{{b}}' })).toBe('{{b}}');
  });

  it('derives a prompt’s variables from its content on save', async () => {
    const prompt = await PromptModel.create({
      title: 'Outreach',
      category: 'MARKETING',
      content: 'Write to {{company}} about {{product}}',
    });

    expect(prompt.variables).toEqual(['company', 'product']);
  });

  it('runs a prompt with its variables filled in', async () => {
    await seedConfig();
    const prompt = await PromptModel.create({
      title: 'Outreach',
      category: 'MARKETING',
      content: 'Write to {{company}} about {{product}}',
    });
    complete.mockResolvedValue({
      text: 'Done',
      promptTokens: 1,
      completionTokens: 1,
      totalTokens: 2,
    });

    await aiCustomResolvers.Mutation.runPrompt(
      null,
      {
        id: String(prompt._id),
        model: 'gpt-4o-mini',
        variables: [{ name: 'company', value: 'Acme' }],
      },
      asAi,
    );

    // The job's prompt is trimmed on save, so the empty {{product}} leaves no trailing gap.
    const saved = await AiJobModel.findOne({ promptId: String(prompt._id) }).lean();
    expect(saved?.prompt).toBe('Write to Acme about');
  });
});

describe('The AI worker', () => {
  it('moves a queued job to SUCCEEDED', async () => {
    await seedConfig();
    const job = await seedJob();
    complete.mockResolvedValue({
      text: 'Answered',
      promptTokens: 2,
      completionTokens: 2,
      totalTokens: 4,
    });
    await queue(String(job._id));

    expect(await runNextAiJob()).toBe(true);

    const saved = await AiJobModel.findById(job._id).lean();
    expect(saved?.status).toBe('SUCCEEDED');
    expect(saved?.queuedAt).toBeNull();
  });

  it('moves a queued job to FAILED and keeps the reason on the row', async () => {
    await seedConfig();
    const job = await seedJob();
    complete.mockRejectedValue(new Error('rate limited'));
    await queue(String(job._id));

    await runNextAiJob();

    const saved = await AiJobModel.findById(job._id).lean();
    expect(saved?.status).toBe('FAILED');
    expect(saved?.error).toContain('rate limited');
  });

  it('takes the oldest queued job first', async () => {
    await seedConfig();
    const first = await seedJob();
    const second = await seedJob();
    complete.mockResolvedValue({
      text: 'ok',
      promptTokens: 1,
      completionTokens: 1,
      totalTokens: 2,
    });
    await queue(String(first._id));
    await queue(String(second._id));

    await runNextAiJob();

    expect((await AiJobModel.findById(first._id).lean())?.status).toBe('SUCCEEDED');
    expect((await AiJobModel.findById(second._id).lean())?.status).toBe('QUEUED');
  });
});
