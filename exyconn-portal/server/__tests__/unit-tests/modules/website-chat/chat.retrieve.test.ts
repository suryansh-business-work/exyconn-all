import {
  embedStaleKnowledge,
  forgetKnowledgeCache,
  knowledgeFor,
} from '../../../../src/modules/website-chat/chat.retrieve';
import { ChatKnowledgeModel } from '../../../../src/modules/website-chat/models';
import { openAiClient } from '../../../../src/utils/openai';

jest.mock('../../../../src/utils/openai', () => ({ openAiClient: { embed: jest.fn() } }));

const embed = openAiClient.embed as jest.Mock;
const embedder = { apiKey: `key-${Date.now()}`, model: 'text-embedding-3-small' };
const ORG = 'org-1';

/** A tiny meaning space: pricing, careers; 'mismatch' is a different length, 'blank' none. */
function vectorFor(text: string): number[] {
  const lower = text.toLowerCase();
  if (lower.includes('blank')) {
    return [];
  }
  if (lower.includes('mismatch')) {
    return [1, 0, 0];
  }
  return [lower.includes('pricing') ? 1 : 0, lower.includes('careers') ? 1 : 0];
}

const seed = () =>
  ChatKnowledgeModel.insertMany([
    {
      title: 'Pricing',
      content: 'Plans start at $10.',
      url: 'https://exyconn.com/pricing',
      source: 'WEBSITE',
    },
    { title: 'Careers', content: 'We hire engineers.', source: 'CUSTOM' },
    {
      title: 'Office',
      content: 'Our office is in Pune.',
      url: 'https://exyconn.com/office',
      source: 'WEBSITE',
    },
    { title: 'Retired', content: 'Old pricing page.', isActive: false },
  ]);

beforeEach(() => {
  forgetKnowledgeCache();
  embed.mockImplementation(async (_key: string, _model: string, input: string[]) =>
    input.map(vectorFor),
  );
});
afterEach(() => jest.restoreAllMocks());

describe('embedStaleKnowledge', () => {
  it('embeds each active row once, and again only when its text or the model changes', async () => {
    await seed();
    await expect(embedStaleKnowledge(embedder)).resolves.toBe(3);
    expect(embed).toHaveBeenCalledTimes(1);
    expect(embed.mock.calls[0][2]).toHaveLength(3);
    expect(embed).toHaveBeenCalledWith(
      embedder.apiKey,
      embedder.model,
      expect.arrayContaining([
        'Pricing\nPlans start at $10.',
        'Careers\nWe hire engineers.',
        'Office\nOur office is in Pune.',
      ]),
    );
    const stored = await ChatKnowledgeModel.findOne({ title: 'Pricing' })
      .select('+embedding')
      .lean();
    expect(stored?.embedding).toEqual([1, 0]);

    await expect(embedStaleKnowledge(embedder)).resolves.toBe(0);
    await ChatKnowledgeModel.updateOne({ title: 'Office' }, { content: 'Now in Mumbai.' });
    await expect(embedStaleKnowledge(embedder)).resolves.toBe(1);
    await expect(embedStaleKnowledge({ ...embedder, model: 'other' })).resolves.toBe(3);
  });

  it('sends the rows in batches of sixty-four', async () => {
    await ChatKnowledgeModel.insertMany(
      Array.from({ length: 65 }, (_, i) => ({ title: `Row ${i}`, content: 'text' })),
    );
    await expect(embedStaleKnowledge(embedder)).resolves.toBe(65);
    expect(embed.mock.calls.map((call) => call[2].length)).toEqual([64, 1]);
  });
});

describe('knowledgeFor', () => {
  it('finds the knowledge by meaning and words, numbered with its source', async () => {
    await seed();
    const knowledge = await knowledgeFor('How much is pricing?', 12000, ORG, embedder);
    expect(knowledge).toEqual({
      text: '[1] Pricing (https://exyconn.com/pricing)\nPlans start at $10.',
      sources: [{ title: 'Pricing', url: 'https://exyconn.com/pricing' }],
    });
  });

  it("ranks the team's own notes first and keeps word matches with no meaning", async () => {
    await seed();
    const knowledge = await knowledgeFor('office careers', 12000, ORG, embedder);
    expect(knowledge.text).toBe(
      '[1] Careers\nWe hire engineers.\n\n[2] Office (https://exyconn.com/office)\nOur office is in Pune.',
    );
    expect(knowledge.sources.map((s) => s.title)).toEqual(['Careers', 'Office']);
  });

  it('stops before the context window would overflow', async () => {
    await seed();
    const first = '[1] Careers\nWe hire engineers.';
    const knowledge = await knowledgeFor('office careers', first.length, ORG, embedder);
    expect(knowledge.text).toBe(first);
    const none = await knowledgeFor('office careers', first.length - 1, ORG, embedder);
    expect(none).toEqual({ text: '', sources: [] });
  });

  it('finds nothing for a question with no meaning or words in common', async () => {
    await seed();
    await ChatKnowledgeModel.create({ title: 'Blank', content: 'nothing embedded' });
    await expect(knowledgeFor('zzz', 12000, ORG, embedder)).resolves.toEqual({
      text: '',
      sources: [],
    });
    await expect(knowledgeFor('mismatch qqq', 12000, ORG, embedder)).resolves.toEqual({
      text: '',
      sources: [],
    });
  });

  it('reads the knowledge at most once a minute per company and model', async () => {
    await seed();
    const find = jest.spyOn(ChatKnowledgeModel, 'find');
    const start = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(start);

    await knowledgeFor('pricing', 12000, ORG, embedder);
    const reads = find.mock.calls.length;
    expect(reads).toBe(2);
    clock.mockReturnValue(start + 59_999);
    await knowledgeFor('pricing', 12000, ORG, embedder);
    expect(find.mock.calls.length).toBe(reads);

    await knowledgeFor('pricing', 12000, 'org-2', embedder);
    expect(find.mock.calls.length).toBe(reads * 2);
    await knowledgeFor('pricing', 12000, 'org-2', { ...embedder, model: 'other' });
    expect(find.mock.calls.length).toBe(reads * 3);
    clock.mockReturnValue(start + 200_000);
    await knowledgeFor('pricing', 12000, 'org-2', { ...embedder, model: 'other' });
    expect(find.mock.calls.length).toBe(reads * 4);
  });

  it('serves the cached rows until the cache is forgotten', async () => {
    await seed();
    await knowledgeFor('pricing', 12000, ORG, embedder);
    await ChatKnowledgeModel.create({ title: 'Plans FAQ', content: 'Pricing is monthly.' });
    const cached = await knowledgeFor('pricing', 12000, ORG, embedder);
    expect(cached.sources.map((s) => s.title)).toEqual(['Pricing']);
    forgetKnowledgeCache();
    const knowledge = await knowledgeFor('pricing', 12000, ORG, embedder);
    expect(knowledge.sources.map((s) => s.title)).toEqual(['Pricing', 'Plans FAQ']);
  });
});
