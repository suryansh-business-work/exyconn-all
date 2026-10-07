import { randomUUID } from 'node:crypto';
import {
  AI_DRAFT_KINDS,
  SUMMARY_STYLES,
  aiDraft,
  aiSummarise,
  runAssist,
} from '../../../../src/modules/ai/ai.actions';
import { aiCustomResolvers } from '../../../../src/modules/ai/ai.resolvers';
import { AiJobModel } from '../../../../src/modules/ai/ai.model';
import { AiSpendLimitModel } from '../../../../src/modules/ai/ai-spend-limit.model';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import { openAiClient } from '../../../../src/utils/openai';
import { logger } from '../../../../src/utils/logger';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

jest.mock('../../../../src/utils/openai', () => ({
  openAiClient: { complete: jest.fn(), listModels: jest.fn() },
}));

const complete = openAiClient.complete as jest.Mock;
const actor = { id: 'user-1', name: 'ai@exyconn.com' };
const asAi: GraphQLContext = { user: { id: 'user-1', roles: [ROLES.AI], email: 'ai@exyconn.com' } };
const asEmployee: GraphQLContext = {
  user: { id: 'user-2', roles: [ROLES.EMPLOYEE], email: 'e@exyconn.com' },
};

const answer = (text: string) =>
  complete.mockResolvedValue({ text, promptTokens: 3, completionTokens: 2, totalTokens: 5 });
const sentPrompt = (): string => complete.mock.calls[0][0].prompt;

beforeEach(async () => {
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  await OpenAiConfigModel.create({
    label: 'Primary',
    apiKey: randomUUID(),
    defaultModel: 'gpt-4o-mini',
    isActive: true,
  });
});
afterEach(() => jest.restoreAllMocks());

describe('runAssist', () => {
  it('runs on the default model, keeps the run in the history and returns the answer', async () => {
    answer('Short version');

    await expect(runAssist('Summarise (brief)', 'Text', actor)).resolves.toBe('Short version');

    const job = await AiJobModel.findOne().lean();
    expect(job).toMatchObject({
      name: 'Summarise (brief)',
      model: 'gpt-4o-mini',
      status: 'SUCCEEDED',
      createdById: 'user-1',
      createdByName: 'ai@exyconn.com',
    });
  });

  it('turns a failed run into an error the caller sees', async () => {
    complete.mockRejectedValue(new Error('quota exceeded'));

    await expect(runAssist('Assist', 'Text', actor)).rejects.toThrow('quota exceeded');
    expect((await AiJobModel.findOne().lean())?.status).toBe('FAILED');
  });

  it('refuses before spending once the budget is used up', async () => {
    await AiSpendLimitModel.create({ key: 'global', monthlyUsdCap: 1, enabled: true });
    await AiJobModel.create({
      name: 'Earlier',
      model: 'gpt-4o',
      prompt: 'x',
      status: 'SUCCEEDED',
      costUsd: 2,
      ranAt: new Date(),
    });

    await expect(runAssist('Assist', 'Text', actor)).rejects.toThrow(/monthly AI budget/);
    expect(complete).not.toHaveBeenCalled();
  });
});

describe('aiSummarise', () => {
  it('asks for each style in its own words, with the trimmed text', async () => {
    answer('ok');

    await aiSummarise('  The quarterly numbers.  ', 'BULLETS', actor);

    expect(sentPrompt()).toBe(
      'Summarise it as at most six short bullet points, one fact each.\n\nText:\nThe quarterly numbers.',
    );
    expect((await AiJobModel.findOne().lean())?.name).toBe('Summarise (bullets)');
  });

  it('refuses empty text and text past the limit, without a run', async () => {
    expect(() => aiSummarise('   ', 'BRIEF', actor)).toThrow(
      'The text to summarise cannot be empty',
    );
    expect(() => aiSummarise('x'.repeat(20_001), 'BRIEF', actor)).toThrow(/must be at most 20/);
    expect(complete).not.toHaveBeenCalled();
  });

  it('accepts text exactly at the limit', async () => {
    answer('ok');

    await expect(aiSummarise('x'.repeat(20_000), 'DETAILED', actor)).resolves.toBe('ok');
  });
});

describe('aiDraft', () => {
  it.each([
    ['JOB_DESCRIPTION', 'Draft job description', 'Write a job description'],
    ['EMAIL_REPLY', 'Draft email reply', 'Write a polite, direct email reply'],
    ['RELEASE_NOTE', 'Draft release note', 'Write release notes'],
    ['MEETING_NOTES', 'Draft meeting notes', 'Write meeting notes'],
  ] as const)('drafts a %s under its own name', async (kind, label, instruction) => {
    answer('Draft');

    await expect(aiDraft(kind, 'Backend role', actor)).resolves.toBe('Draft');

    expect(sentPrompt().startsWith(instruction)).toBe(true);
    expect(sentPrompt().endsWith('\n\nContext:\nBackend role')).toBe(true);
    expect((await AiJobModel.findOne().lean())?.name).toBe(label);
  });

  it('refuses empty context', () => {
    expect(() => aiDraft('EMAIL_REPLY', '', actor)).toThrow(
      'The context to draft from cannot be empty',
    );
  });

  it('offers exactly the kinds and styles the schema lists', () => {
    expect(AI_DRAFT_KINDS).toHaveLength(4);
    expect(SUMMARY_STYLES).toEqual(['BRIEF', 'BULLETS', 'DETAILED']);
  });
});

describe('the assist resolvers', () => {
  it('summarises briefly when no style is given, attributed from the token', async () => {
    answer('Brief');

    await expect(
      aiCustomResolvers.Mutation.aiSummarise(null, { text: 'Long text', style: null }, asAi),
    ).resolves.toBe('Brief');

    expect(sentPrompt().startsWith('Summarise it in two or three plain sentences.')).toBe(true);
    expect((await AiJobModel.findOne().lean())?.createdByName).toBe('ai@exyconn.com');
  });

  it('drafts through the resolver', async () => {
    answer('Notes');

    await expect(
      aiCustomResolvers.Mutation.aiDraft(null, { kind: 'MEETING_NOTES', context: 'Standup' }, asAi),
    ).resolves.toBe('Notes');
  });

  it('keeps both assists from somebody without the AI role', async () => {
    await expect(
      aiCustomResolvers.Mutation.aiSummarise(null, { text: 'x' }, asEmployee),
    ).rejects.toThrow();
    await expect(
      aiCustomResolvers.Mutation.aiDraft(null, { kind: 'EMAIL_REPLY', context: 'x' }, asEmployee),
    ).rejects.toThrow();
    expect(complete).not.toHaveBeenCalled();
  });
});
