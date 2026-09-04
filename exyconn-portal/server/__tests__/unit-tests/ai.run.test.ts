import { aiCustomResolvers } from '../../src/modules/ai/ai.resolvers';
import { AiJobModel } from '../../src/modules/ai/ai.model';
import { PromptModel } from '../../src/modules/ai/prompt.model';
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

const run = (id: string) => aiCustomResolvers.Mutation.runAiJob(null, { id }, asAi);

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
