import {
  forgetKnowledgeCache,
  knowledgeFor,
} from '../../../../src/modules/website-chat/chat.retrieve';
import { ChatKnowledgeModel } from '../../../../src/modules/website-chat/models';
import { openAiClient } from '../../../../src/utils/openai';

jest.mock('../../../../src/utils/openai', () => ({ openAiClient: { embed: jest.fn() } }));

const embed = openAiClient.embed as jest.Mock;
const embedder = { apiKey: `key-edges-${Date.now()}`, model: 'text-embedding-3-small' };

beforeEach(() => {
  forgetKnowledgeCache();
});
afterEach(() => jest.restoreAllMocks());

describe('knowledgeFor when the embedding service returns no vectors', () => {
  it('still finds a row by its words, since a row without a vector has no meaning to compare', async () => {
    embed.mockResolvedValue([]);
    await ChatKnowledgeModel.create({
      title: 'Pricing',
      content: 'Plans start at $10.',
      source: 'CUSTOM',
    });

    const knowledge = await knowledgeFor('pricing', 12000, 'org-edges', embedder);

    expect(knowledge).toEqual({
      text: '[1] Pricing\nPlans start at $10.',
      sources: [{ title: 'Pricing', url: '' }],
    });
  });
});

describe('knowledgeFor with a question that has no word of three letters', () => {
  it('has no terms to match and finds nothing', async () => {
    embed.mockImplementation(async (_key: string, _model: string, input: string[]) =>
      input.map(() => [0, 0]),
    );
    await ChatKnowledgeModel.create({ title: 'Pricing', content: 'Plans start at $10.' });

    await expect(knowledgeFor('hi', 12000, 'org-edges-2', embedder)).resolves.toEqual({
      text: '',
      sources: [],
    });
  });
});
