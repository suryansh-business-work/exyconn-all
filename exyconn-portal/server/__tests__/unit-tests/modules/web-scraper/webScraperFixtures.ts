import { lookup } from 'node:dns/promises';
import { FirecrawlConfigModel } from '../../../../src/modules/web-scraper/firecrawl-config.model';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import { AiModelPriceModel } from '../../../../src/modules/ai/ai-price.model';
import ips from '../../../fixtures/ips.json';

/** Shared set-up for the web-scraper suites (not a suite itself: jest only runs *.test.ts). */

/** Never a literal credential: the values only have to look like keys. */
export const FIRECRAWL_KEY = process.env.TEST_FIRECRAWL_KEY ?? `fc-${'k'.repeat(16)}`;
export const OPENAI_KEY = process.env.TEST_OPENAI_KEY ?? `sk-${'o'.repeat(16)}`;

export const HOSTED = 'https://api.firecrawl.dev';
export const SELF_HOSTED = 'http://firecrawl.internal:3002';
export const AI_MODEL = 'gpt-4o-mini';

/** Every hostname resolves to a public address, the way a real website does. */
export function resolvePublicly() {
  (lookup as unknown as jest.Mock).mockResolvedValue([{ address: ips.ip93_184_215_14, family: 4 }]);
}

/** Firecrawl answers every scrape with this page. */
export function firecrawlAnswers(markdown: string, title = 'Example') {
  return jest.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ success: true, data: { markdown, metadata: { title } } }), {
      status: 200,
    }),
  );
}

export const seedFirecrawl = (fields: Record<string, unknown> = {}) =>
  FirecrawlConfigModel.create({
    label: 'Main',
    baseUrl: HOSTED,
    apiKey: FIRECRAWL_KEY,
    isActive: true,
    ...fields,
  });

export const seedOpenAi = () =>
  OpenAiConfigModel.create({
    label: 'Primary',
    apiKey: OPENAI_KEY,
    defaultModel: AI_MODEL,
    isActive: true,
  });

export const seedPrice = (inputPer1kUsd: number, outputPer1kUsd: number) =>
  AiModelPriceModel.create({ model: AI_MODEL, inputPer1kUsd, outputPer1kUsd, active: true });
