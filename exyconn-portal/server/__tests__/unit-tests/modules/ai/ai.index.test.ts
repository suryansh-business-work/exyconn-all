import { Types } from 'mongoose';
import { aiResolvers, aiTypeDefs, runNextAiJob, startAiWorker } from '../../../../src/modules/ai';
import { PromptModel } from '../../../../src/modules/ai/prompt.model';
import { AiJobModel } from '../../../../src/modules/ai/ai.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = aiResolvers.Query as unknown as Record<string, Resolver>;
const M = aiResolvers.Mutation as unknown as Record<string, Resolver>;

const asAi: GraphQLContext = { user: { id: 'user-1', roles: [ROLES.AI], email: 'ai@exyconn.com' } };
const asEmployee: GraphQLContext = {
  user: { id: 'user-2', roles: [ROLES.EMPLOYEE], email: 'e@exyconn.com' },
};

describe('the AI module surface', () => {
  it('merges job CRUD, prompt CRUD, OpenAI calls and pricing into one resolver map', () => {
    expect(Object.keys(Q)).toEqual(
      expect.arrayContaining([
        'listAiJobs',
        'listAiJobsPaged',
        'listAiJobsStats',
        'listPrompts',
        'listPromptsPaged',
        'listPromptsStats',
        'aiModels',
        'aiSpendSummary',
        'listAiModelPrices',
        'aiSpendLimit',
      ]),
    );
    expect(Object.keys(M)).toEqual(
      expect.arrayContaining([
        'createAiJob',
        'createPrompt',
        'runAiJob',
        'runPrompt',
        'saveAiModelPrice',
      ]),
    );
    expect(aiTypeDefs).toBeDefined();
    expect(typeof runNextAiJob).toBe('function');
    expect(typeof startAiWorker).toBe('function');
  });

  it('keeps the job and prompt CRUD for the AI role', async () => {
    await expect(Q.listAiJobs(null, {}, asEmployee)).rejects.toThrow();
    await expect(Q.listPrompts(null, {}, asEmployee)).rejects.toThrow();
  });

  it('sums tokens and cost and counts by status on the jobs dashboard', async () => {
    await AiJobModel.create({
      name: 'A',
      model: 'm',
      prompt: 'p',
      status: 'SUCCEEDED',
      totalTokens: 10,
      costUsd: 0.5,
    });
    await AiJobModel.create({
      name: 'B',
      model: 'm',
      prompt: 'p',
      status: 'FAILED',
      totalTokens: 5,
      costUsd: 0.25,
    });

    const stats = (await Q.listAiJobsStats(null, {}, asAi)) as {
      total: number;
      counts: Array<{ field: string }>;
      sums: Array<{ field: string; total: number }>;
    };

    expect(stats.total).toBe(2);
    expect(stats.counts.map((count) => count.field)).toEqual(['status', 'model']);
    expect(stats.sums).toEqual([
      { field: 'totalTokens', total: 15 },
      { field: 'costUsd', total: 0.75 },
    ]);
  });
});

describe('prompt variables follow the content', () => {
  it('derives them when a prompt is created through the library', async () => {
    const created = (await M.createPrompt(
      null,
      {
        input: { title: 'Outreach', category: 'MARKETING', content: 'Hi {{name}} at {{company}}' },
      },
      asAi,
    )) as { id: string; variables: string[] };

    expect(created.variables).toEqual(['name', 'company']);
  });

  it('re-derives them when the content is edited', async () => {
    const prompt = await PromptModel.create({
      title: 'T',
      category: 'GENERAL',
      content: 'Hi {{name}}',
    });

    await M.updatePrompt(
      null,
      {
        id: prompt._id.toHexString(),
        input: { title: 'T', category: 'GENERAL', content: 'About {{topic}}' },
      },
      asAi,
    );

    expect((await PromptModel.findById(prompt._id).lean())?.variables).toEqual(['topic']);
  });

  it('leaves them alone when an edit does not touch the content', async () => {
    const prompt = await PromptModel.create({
      title: 'T',
      category: 'GENERAL',
      content: 'Hi {{name}}',
    });

    await PromptModel.findOneAndUpdate({ _id: prompt._id }, { title: 'Renamed' });

    expect((await PromptModel.findById(prompt._id).lean())?.variables).toEqual(['name']);
  });
});

describe('runPrompt', () => {
  it('reports a library entry that does not exist, creating no job', async () => {
    await expect(
      M.runPrompt(null, { id: new Types.ObjectId().toHexString(), model: 'gpt-4o-mini' }, asAi),
    ).rejects.toThrow('Prompt not found');
    expect(await AiJobModel.countDocuments()).toBe(0);
  });
});
