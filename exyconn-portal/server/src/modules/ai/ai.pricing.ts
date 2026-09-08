import { AiModelPriceModel } from './ai-price.model';
import { logger } from '../../utils/logger';

/** Prices are quoted per thousand tokens, so token counts are divided by this. */
const TOKENS_PER_PRICE_UNIT = 1000;

/** A price, in the only two numbers the cost of a run depends on. */
export interface ModelPrice {
  inputPer1kUsd: number;
  outputPer1kUsd: number;
}

/** The tokens one finished run reported. */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

/**
 * SEED VALUES — edit them in the portal, not here.
 *
 * Common OpenAI list prices in USD per 1,000 tokens, correct when this shipped. They are
 * inserted only when a row for the model is absent, so a price corrected in Tech >
 * Environment Variables > AI Pricing survives every restart and every release.
 */
const SEED_PRICES: Array<{ model: string } & ModelPrice> = [
  { model: 'gpt-4o', inputPer1kUsd: 0.0025, outputPer1kUsd: 0.01 },
  { model: 'gpt-4o-mini', inputPer1kUsd: 0.00015, outputPer1kUsd: 0.0006 },
  { model: 'gpt-4.1', inputPer1kUsd: 0.002, outputPer1kUsd: 0.008 },
  { model: 'gpt-4.1-mini', inputPer1kUsd: 0.0004, outputPer1kUsd: 0.0016 },
  { model: 'gpt-4.1-nano', inputPer1kUsd: 0.0001, outputPer1kUsd: 0.0004 },
  { model: 'o3-mini', inputPer1kUsd: 0.0011, outputPer1kUsd: 0.0044 },
  { model: 'gpt-3.5-turbo', inputPer1kUsd: 0.0005, outputPer1kUsd: 0.0015 },
];

/**
 * What a run cost, given its tokens and the price on file.
 *
 * Pure, so the arithmetic is testable without a database. A missing price is zero, never
 * an estimate: an invented number would flow into the spend caps and the per-user
 * summary, and nobody would ever question it — whereas a zero is visibly wrong.
 */
export function computeCostUsd(usage: TokenUsage, price: ModelPrice | null): number {
  if (!price) {
    return 0;
  }
  const input = (usage.promptTokens / TOKENS_PER_PRICE_UNIT) * price.inputPer1kUsd;
  const output = (usage.completionTokens / TOKENS_PER_PRICE_UNIT) * price.outputPer1kUsd;
  return input + output;
}

/** The active price row for a model, or null when the model has no price on file. */
export async function priceForModel(model: string): Promise<ModelPrice | null> {
  const row = await AiModelPriceModel.findOne({ model, active: true })
    .select('inputPer1kUsd outputPer1kUsd')
    .lean();
  if (!row) {
    return null;
  }
  return { inputPer1kUsd: row.inputPer1kUsd, outputPer1kUsd: row.outputPer1kUsd };
}

/** What one finished run cost, at the price the model carries right now. */
export async function costOfRun(model: string, usage: TokenUsage): Promise<number> {
  return computeCostUsd(usage, await priceForModel(model));
}

/**
 * Creates any seeded price that is missing. Idempotent, and never an update: an existing
 * row is somebody's correction and is left exactly as it is.
 */
export async function ensureAiModelPrices(): Promise<void> {
  let created = 0;
  for (const price of SEED_PRICES) {
    const result = await AiModelPriceModel.updateOne(
      { model: price.model },
      { $setOnInsert: { ...price, active: true } },
      { upsert: true },
    );
    created += result.upsertedCount ?? 0;
  }
  if (created > 0) {
    logger.info(`Seeded ${created} AI model price(s)`);
  }
}
