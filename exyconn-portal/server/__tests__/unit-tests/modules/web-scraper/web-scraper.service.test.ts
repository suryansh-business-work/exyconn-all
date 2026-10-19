import { Types } from 'mongoose';
import {
  EXPECTED_OUTPUT_TOKENS,
  MAX_AI_CHARS,
  MAX_INSTRUCTION_CHARS,
  MAX_STORED_CHARS,
  firecrawlConfigs,
  webScraper,
} from '../../../../src/modules/web-scraper/web-scraper.service';
import { FirecrawlConfigModel } from '../../../../src/modules/web-scraper/firecrawl-config.model';
import { WebScrapeModel } from '../../../../src/modules/web-scraper/web-scrape.model';
import { openAiClient } from '../../../../src/utils/openai';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import {
  AI_MODEL,
  FIRECRAWL_KEY,
  HOSTED,
  SELF_HOSTED,
  firecrawlAnswers,
  resolvePublicly,
  seedFirecrawl,
  seedOpenAi,
  seedPrice,
} from './webScraperFixtures';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));
jest.mock('../../../../src/utils/openai', () => ({
  openAiClient: { complete: jest.fn(), listModels: jest.fn() },
}));

useTestOrganization();

const complete = openAiClient.complete as jest.Mock;
const actor = { id: new Types.ObjectId().toHexString(), name: 'sales@exyconn.com' };
const missingId = () => new Types.ObjectId().toHexString();
const input = (fields: Partial<Parameters<typeof firecrawlConfigs.create>[0]> = {}) => ({
  label: 'Main',
  baseUrl: HOSTED,
  apiKey: FIRECRAWL_KEY,
  ...fields,
});

beforeEach(() => {
  resolvePublicly();
});

afterEach(() => {
  jest.restoreAllMocks();
  complete.mockReset();
});

/** Reads a stored config straight from the collection, key included. */
const stored = (id: unknown) => FirecrawlConfigModel.findById(id).lean();

describe('firecrawlConfigs.create', () => {
  it('stores a hosted config with its key', async () => {
    const created = await firecrawlConfigs.create(input());

    expect(created).toMatchObject({ label: 'Main', baseUrl: HOSTED, isActive: false });
    expect((await stored(created._id))?.apiKey).toBe(FIRECRAWL_KEY);
  });

  it('stores a self-hosted config without any key', async () => {
    const created = await firecrawlConfigs.create(input({ baseUrl: SELF_HOSTED, apiKey: '' }));

    expect(created.baseUrl).toBe(SELF_HOSTED);
    expect(created.apiKey).toBe('');
  });

  it('refuses the hosted API without a key', async () => {
    expect(await codeOf(firecrawlConfigs.create(input({ apiKey: '  ' })))).toBe('BAD_USER_INPUT');
    expect(await FirecrawlConfigModel.countDocuments()).toBe(0);
  });

  it.each(['not a url', 'ftp://files.example.com'])('refuses the base URL %s', async (baseUrl) => {
    expect(await codeOf(firecrawlConfigs.create(input({ baseUrl })))).toBe('BAD_USER_INPUT');
  });

  it('switches every other config off when the new one is active', async () => {
    const older = await seedFirecrawl();

    const created = await firecrawlConfigs.create(input({ label: 'New', isActive: true }));

    expect(created.isActive).toBe(true);
    expect((await stored(older._id))?.isActive).toBe(false);
  });
});

describe('firecrawlConfigs.update', () => {
  it('keeps the stored key when the hosted config is saved with a blank one', async () => {
    const config = await seedFirecrawl({ isActive: false });

    const saved = await firecrawlConfigs.update(config.id, input({ label: 'Renamed', apiKey: '' }));

    expect(saved.label).toBe('Renamed');
    expect((await stored(config._id))?.apiKey).toBe(FIRECRAWL_KEY);
  });

  it('refuses a blank key on the hosted API when none is stored', async () => {
    const config = await seedFirecrawl({ baseUrl: SELF_HOSTED, apiKey: '' });

    expect(await codeOf(firecrawlConfigs.update(config.id, input({ apiKey: '' })))).toBe(
      'BAD_USER_INPUT',
    );
    expect((await stored(config._id))?.baseUrl).toBe(SELF_HOSTED);
  });

  it('answers not found for a hosted config that is not there and has no new key', async () => {
    expect(await codeOf(firecrawlConfigs.update(missingId(), input({ apiKey: '' })))).toBe(
      'NOT_FOUND',
    );
  });

  it('answers not found for any other config that is not there', async () => {
    expect(await codeOf(firecrawlConfigs.update(missingId(), input()))).toBe('NOT_FOUND');
    expect(
      await codeOf(firecrawlConfigs.update(missingId(), input({ baseUrl: SELF_HOSTED }))),
    ).toBe('NOT_FOUND');
  });

  it('replaces the key when a new one is typed', async () => {
    const config = await seedFirecrawl();

    await firecrawlConfigs.update(config.id, input({ apiKey: 'fc-replacement' }));

    expect((await stored(config._id))?.apiKey).toBe('fc-replacement');
  });

  it('refuses a base URL that is not http(s)', async () => {
    const config = await seedFirecrawl();

    expect(
      await codeOf(firecrawlConfigs.update(config.id, input({ baseUrl: 'mailto:a@b.c' }))),
    ).toBe('BAD_USER_INPUT');
  });

  it('switches the others off, and only the others, when made active', async () => {
    const other = await seedFirecrawl({ label: 'Other' });
    const config = await seedFirecrawl({ label: 'Mine', isActive: false });

    await firecrawlConfigs.update(config.id, input({ label: 'Mine', isActive: true }));

    expect((await stored(other._id))?.isActive).toBe(false);
    expect((await stored(config._id))?.isActive).toBe(true);
  });
});

describe('firecrawlConfigs.test, list, remove', () => {
  it('scrapes example.com with the config and says how much came back', async () => {
    const fetchMock = firecrawlAnswers('# Example Domain');
    const config = await seedFirecrawl({ isActive: false });

    expect(await firecrawlConfigs.test(config.id)).toBe(
      'Firecrawl answered with 16 characters of markdown.',
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).url).toBe('https://example.com');
  });

  it('refuses to test a hosted config that has lost its key', async () => {
    const fetchMock = firecrawlAnswers('x');
    const config = await seedFirecrawl({ apiKey: '' });

    expect(await codeOf(firecrawlConfigs.test(config.id))).toBe('BAD_USER_INPUT');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers not found when testing or removing a config that is not there', async () => {
    expect(await codeOf(firecrawlConfigs.test(missingId()))).toBe('NOT_FOUND');
    expect(await codeOf(firecrawlConfigs.remove(missingId()))).toBe('NOT_FOUND');
  });

  it('lists newest first and removes one', async () => {
    const first = await seedFirecrawl({ label: 'First', createdAt: new Date('2025-01-01') });
    await seedFirecrawl({ label: 'Second', createdAt: new Date('2026-01-01') });

    expect((await firecrawlConfigs.list()).map((row) => row.label)).toEqual(['Second', 'First']);
    expect(await firecrawlConfigs.remove(first.id)).toBe(true);
    expect((await firecrawlConfigs.list()).map((row) => row.label)).toEqual(['Second']);
  });
});

describe('firecrawlConfigs.ready', () => {
  it('is false with no active config', async () => {
    await seedFirecrawl({ isActive: false });

    expect(await firecrawlConfigs.ready()).toBe(false);
  });

  it('is false for an active hosted config without a key', async () => {
    await seedFirecrawl({ apiKey: '' });

    expect(await firecrawlConfigs.ready()).toBe(false);
  });

  it('is true for an active hosted config with a key', async () => {
    await seedFirecrawl();

    expect(await firecrawlConfigs.ready()).toBe(true);
  });

  it('is true for an active self-hosted config with no key at all', async () => {
    await FirecrawlConfigModel.collection.insertOne({
      label: 'Old row',
      baseUrl: SELF_HOSTED,
      isActive: true,
    });

    expect(await firecrawlConfigs.ready()).toBe(true);
  });

  it('reads a stored base URL that does not parse as not the hosted API', async () => {
    await FirecrawlConfigModel.collection.insertOne({
      label: 'Typo',
      baseUrl: 'firecrawl internal',
      apiKey: '',
      isActive: true,
    });

    expect(await firecrawlConfigs.ready()).toBe(true);
  });
});

describe('webScraper.scrape', () => {
  it('reads a typed address as https and keeps the page as markdown', async () => {
    const fetchMock = firecrawlAnswers('# Acme', 'Acme Ltd');
    await seedFirecrawl();

    const scrape = await webScraper.scrape('  acme.example.com/about ', actor);

    expect(scrape).toMatchObject({
      url: 'https://acme.example.com/about',
      title: 'Acme Ltd',
      markdown: '# Acme',
      charCount: 6,
      createdById: actor.id,
      createdByName: actor.name,
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).url).toBe(
      'https://acme.example.com/about',
    );
  });

  it('keeps an address that already has its scheme, and cuts a long page', async () => {
    firecrawlAnswers('a'.repeat(MAX_STORED_CHARS + 10));
    await seedFirecrawl();

    const scrape = await webScraper.scrape('HTTPS://acme.example.com', actor);

    expect(scrape.url).toBe('https://acme.example.com/');
    expect(scrape.markdown).toHaveLength(MAX_STORED_CHARS);
    expect(scrape.charCount).toBe(MAX_STORED_CHARS + 10);
  });

  it('refuses to scrape before Firecrawl is configured', async () => {
    const fetchMock = firecrawlAnswers('x');

    await expect(webScraper.scrape('acme.example.com', actor)).rejects.toThrow(
      'Firecrawl is not configured',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to scrape with an active hosted config that has no key', async () => {
    await seedFirecrawl({ apiKey: '' });

    await expect(webScraper.scrape('acme.example.com', actor)).rejects.toThrow(
      'Firecrawl is not configured',
    );
  });

  it('refuses a plain-http address', async () => {
    await seedFirecrawl();

    await expect(webScraper.scrape('http://acme.example.com', actor)).rejects.toThrow();
    expect(await WebScrapeModel.countDocuments()).toBe(0);
  });
});

const seedScrape = (markdown = '# Acme\nWe sell anvils.') =>
  WebScrapeModel.create({
    url: 'https://acme.example.com/',
    title: 'Acme',
    markdown,
    charCount: markdown.length,
    createdById: actor.id,
  });

describe('webScraper.get and remove', () => {
  it('reads and removes a kept page', async () => {
    const scrape = await seedScrape();

    expect((await webScraper.get(scrape.id))?.title).toBe('Acme');
    expect(await webScraper.remove(scrape.id)).toBe(true);
    expect(await codeOf(webScraper.get(scrape.id))).toBe('NOT_FOUND');
  });

  it('answers not found when removing a page that is not there', async () => {
    expect(await codeOf(webScraper.remove(missingId()))).toBe('NOT_FOUND');
  });
});

describe('webScraper.estimate', () => {
  it('prices the prompt and a page-long answer at the model’s price', async () => {
    await seedOpenAi();
    await seedPrice(1, 2);
    const scrape = await seedScrape();

    const estimate = await webScraper.estimate(scrape.id, '  List the products  ');

    expect(estimate.model).toBe(AI_MODEL);
    expect(estimate.outputTokens).toBe(EXPECTED_OUTPUT_TOKENS);
    expect(estimate.inputTokens).toBeGreaterThan(0);
    expect(estimate.costUsd).toBeCloseTo(
      (estimate.inputTokens / 1000) * 1 + (EXPECTED_OUTPUT_TOKENS / 1000) * 2,
    );
    expect(estimate).toMatchObject({ priced: true, truncated: false });
  });

  it('says when the model has no price and when the page is cut for the AI', async () => {
    await seedOpenAi();
    const scrape = await seedScrape('b'.repeat(MAX_AI_CHARS + 1));

    const estimate = await webScraper.estimate(scrape.id, 'Summarise');

    expect(estimate).toMatchObject({ priced: false, costUsd: 0, truncated: true });
    expect(estimate.inputTokens).toBeLessThan((MAX_AI_CHARS + 1000) / 4);
  });

  it.each(['  ab ', 'x'.repeat(MAX_INSTRUCTION_CHARS + 1)])(
    'refuses an instruction of the wrong length',
    async (instruction) => {
      const scrape = await seedScrape();

      expect(await codeOf(webScraper.estimate(scrape.id, instruction))).toBe('BAD_USER_INPUT');
    },
  );

  it('answers not found for a page that is not there', async () => {
    expect(await codeOf(webScraper.estimate(missingId(), 'Summarise'))).toBe('NOT_FOUND');
  });
});

describe('webScraper.analyze', () => {
  it('sends the instruction and the page to the AI and keeps the answer', async () => {
    await seedOpenAi();
    await seedPrice(1, 1);
    complete.mockResolvedValue({
      text: 'Anvils.',
      promptTokens: 1000,
      completionTokens: 1000,
      totalTokens: 2000,
    });
    const scrape = await seedScrape();

    const analyzed = await webScraper.analyze(scrape.id, ' What do they sell? ', actor);

    expect(analyzed).toMatchObject({
      aiInstruction: 'What do they sell?',
      aiResponse: 'Anvils.',
      aiCostUsd: 2,
    });
    expect(analyzed.analyzedAt).toBeInstanceOf(Date);
    const { prompt } = complete.mock.calls[0][0];
    expect(prompt).toContain('Instruction: What do they sell?');
    expect(prompt).toContain('We sell anvils.');
  });

  it('answers not found when the page is deleted while the AI is answering', async () => {
    await seedOpenAi();
    const scrape = await seedScrape();
    complete.mockImplementation(async () => {
      await WebScrapeModel.deleteOne({ _id: scrape._id });
      return { text: 'Late', promptTokens: 1, completionTokens: 1, totalTokens: 2 };
    });

    expect(await codeOf(webScraper.analyze(scrape.id, 'Summarise', actor))).toBe('NOT_FOUND');
  });

  it('refuses a blank instruction before spending anything', async () => {
    const scrape = await seedScrape();

    expect(await codeOf(webScraper.analyze(scrape.id, '   ', actor))).toBe('BAD_USER_INPUT');
    expect(complete).not.toHaveBeenCalled();
  });
});
