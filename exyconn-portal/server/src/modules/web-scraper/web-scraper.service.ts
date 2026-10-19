import { ConfigurationError, badRequest, notFound } from '../../utils/errors';
import { assertPublicHttpsUrl } from '../../utils/safeFetch';
import { runAssistJob } from '../ai/ai.actions';
import { computeCostUsd, priceForModel } from '../ai/ai.pricing';
import { defaultAiModel, type AiActor } from '../ai/ai.service';
import { requireSecret, withoutBlankSecret } from '../tech/tech.service';
import { FirecrawlConfigModel } from './firecrawl-config.model';
import { firecrawlScrape } from './firecrawl.client';
import { WebScrapeModel } from './web-scrape.model';

export interface FirecrawlConfigInput {
  label: string;
  baseUrl: string;
  /**
   * Required for Firecrawl's hosted API only; a self-hosted Firecrawl without authentication
   * needs none. Empty when editing keeps the stored key.
   */
  apiKey: string;
  isActive?: boolean | null;
}

/** The most of a page kept: a long page is cut here, and the cut is said out loud. */
export const MAX_STORED_CHARS = 200_000;
/** The most of a page the AI reads, so one long page cannot spend the budget. */
export const MAX_AI_CHARS = 60_000;
export const MAX_INSTRUCTION_CHARS = 1000;
/** Roughly how many characters one token is, for English prose and markdown. */
const CHARS_PER_TOKEN = 4;
/** What an answer is assumed to run to when estimating: a page of text. */
export const EXPECTED_OUTPUT_TOKENS = 800;

const NOT_CONFIGURED =
  'Firecrawl is not configured. Add a config in Tech > Environment Variables > Firecrawl.';

/** Firecrawl's hosted API, the one install that always needs an API key. */
const HOSTED_HOSTNAME = 'api.firecrawl.dev';
const HTTP_PROTOCOLS = new Set(['http:', 'https:']);
const KEY_LABEL = 'An API key for the hosted Firecrawl API';

/** Refuses a base URL that is not an http(s) address. */
function assertBaseUrl(baseUrl: string): void {
  const url = URL.canParse(baseUrl) ? new URL(baseUrl) : null;
  if (!url || !HTTP_PROTOCOLS.has(url.protocol)) {
    badRequest('Base URL must be an http:// or https:// address.');
  }
}

/** True for Firecrawl's hosted API; a self-hosted Firecrawl may run without authentication. */
const isHostedBaseUrl = (baseUrl: string) =>
  URL.canParse(baseUrl) && new URL(baseUrl).hostname === HOSTED_HOSTNAME;

/** A config can run when it has a key, or points at a self-hosted Firecrawl that needs none. */
const canRun = (config: { baseUrl: string; apiKey?: string | null }) =>
  Boolean(config.apiKey?.trim()) || !isHostedBaseUrl(config.baseUrl);

/** The hosted API needs a key; a self-hosted base URL does not. */
function requireKeyFor(baseUrl: string, apiKey: string | undefined): void {
  if (isHostedBaseUrl(baseUrl)) {
    requireSecret(apiKey, KEY_LABEL);
  }
}

/** A typed address with no scheme is read as https. */
const withScheme = (raw: string) => (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);

async function activeConfig() {
  const config = await FirecrawlConfigModel.findOne({ isActive: true }).lean();
  if (!config || !canRun(config)) {
    throw new ConfigurationError(NOT_CONFIGURED);
  }
  return config;
}

async function findScrape(id: string) {
  const scrape = await WebScrapeModel.findById(id).lean();
  if (!scrape) notFound('Scraped page');
  return scrape;
}

function assertInstruction(instruction: string): string {
  const text = instruction.trim();
  if (text.length < 3 || text.length > MAX_INSTRUCTION_CHARS) {
    badRequest(`Tell the AI what to do in 3–${MAX_INSTRUCTION_CHARS} characters.`);
  }
  return text;
}

/** The prompt the AI reads: the instruction, then the page (cut to {@link MAX_AI_CHARS}). */
function promptOf(scrape: { url: string; markdown: string }, instruction: string): string {
  return [
    'Follow the instruction using only the web page below. Say so when the page does not answer it.',
    `Instruction: ${instruction}`,
    `Web page (${scrape.url}):`,
    scrape.markdown.slice(0, MAX_AI_CHARS),
  ].join('\n\n');
}

const tokensOf = (text: string) => Math.ceil(text.length / CHARS_PER_TOKEN);

/** Tech > Environment Variables > Firecrawl: one config active at a time. */
export const firecrawlConfigs = {
  list() {
    return FirecrawlConfigModel.find().sort({ createdAt: -1 }).lean();
  },

  async create(input: FirecrawlConfigInput) {
    assertBaseUrl(input.baseUrl);
    requireKeyFor(input.baseUrl, input.apiKey);
    if (input.isActive) {
      await FirecrawlConfigModel.updateMany({}, { isActive: false });
    }
    return (await FirecrawlConfigModel.create(input)).toObject();
  },

  /** A blank key keeps the stored one, which must exist when the base URL is the hosted API. */
  async update(id: string, input: FirecrawlConfigInput) {
    assertBaseUrl(input.baseUrl);
    if (isHostedBaseUrl(input.baseUrl) && !input.apiKey.trim()) {
      const current = await FirecrawlConfigModel.findById(id).select('apiKey').lean();
      if (!current) notFound('Firecrawl config');
      requireKeyFor(input.baseUrl, current.apiKey);
    }
    if (input.isActive) {
      await FirecrawlConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const doc = await FirecrawlConfigModel.findByIdAndUpdate(
      id,
      withoutBlankSecret(input, 'apiKey'),
      { new: true },
    ).lean();
    if (!doc) notFound('Firecrawl config');
    return doc;
  },

  /** Scrapes example.com with this config (and its key, if any); Firecrawl's error is kept. */
  async test(id: string) {
    const config = await FirecrawlConfigModel.findById(id).lean();
    if (!config) notFound('Firecrawl config');
    requireKeyFor(config.baseUrl, config.apiKey);
    const page = await firecrawlScrape(config.baseUrl, config.apiKey, 'https://example.com');
    return `Firecrawl answered with ${page.markdown.length} characters of markdown.`;
  },

  async remove(id: string) {
    const doc = await FirecrawlConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Firecrawl config');
    return true;
  },

  /** An active config with a key, or an active self-hosted one that needs none. */
  async ready(): Promise<boolean> {
    const config = await FirecrawlConfigModel.findOne({ isActive: true })
      .select('baseUrl apiKey')
      .lean();
    return Boolean(config && canRun(config));
  },
};

/** CRM > Tools > Website scraper: read a page, then hand it to the AI once the cost is agreed. */
export const webScraper = {
  /** Reads a public page through Firecrawl and keeps it as markdown. */
  async scrape(rawUrl: string, actor: AiActor) {
    const url = await assertPublicHttpsUrl(withScheme(rawUrl.trim()));
    const config = await activeConfig();
    const page = await firecrawlScrape(config.baseUrl, config.apiKey, url.href);
    const markdown = page.markdown.slice(0, MAX_STORED_CHARS);
    return (
      await WebScrapeModel.create({
        url: url.href,
        title: page.title,
        markdown,
        charCount: page.markdown.length,
        createdById: actor.id,
        createdByName: actor.name,
      })
    ).toObject();
  },

  get: findScrape,

  async remove(id: string) {
    const doc = await WebScrapeModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Scraped page');
    return true;
  },

  /**
   * What sending the page to the AI would cost, before anything is spent: the prompt's tokens
   * (about four characters each), a page-long answer, and the model's price on file.
   */
  async estimate(id: string, instruction: string) {
    const scrape = await findScrape(id);
    const prompt = promptOf(scrape, assertInstruction(instruction));
    const model = await defaultAiModel();
    const price = await priceForModel(model);
    const inputTokens = tokensOf(prompt);
    return {
      model,
      inputTokens,
      outputTokens: EXPECTED_OUTPUT_TOKENS,
      costUsd: computeCostUsd(
        { promptTokens: inputTokens, completionTokens: EXPECTED_OUTPUT_TOKENS },
        price,
      ),
      priced: price !== null,
      truncated: scrape.markdown.length > MAX_AI_CHARS,
    };
  },

  /** Sends the page and the instruction to the AI, and keeps the answer and what it cost. */
  async analyze(id: string, instruction: string, actor: AiActor) {
    const scrape = await findScrape(id);
    const text = assertInstruction(instruction);
    const job = await runAssistJob('Website scrape', promptOf(scrape, text), actor);
    const doc = await WebScrapeModel.findByIdAndUpdate(
      id,
      {
        aiInstruction: text,
        aiResponse: job.response,
        aiCostUsd: job.costUsd,
        analyzedAt: new Date(),
      },
      { new: true },
    ).lean();
    if (!doc) notFound('Scraped page');
    return doc;
  },
};
