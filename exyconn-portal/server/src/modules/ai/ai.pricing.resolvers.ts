import { AiModelPriceModel } from './ai-price.model';
import { AiSpendLimitModel, AI_SPEND_LIMIT_KEY } from './ai-spend-limit.model';
import { readAiSpendLimit } from './ai.budget';
import { assertRole } from '../../middleware/roleGuard';
import { badRequest } from '../../utils/errors';
import { withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

/** Tech owns what AI costs; the AI module only reads the ceiling to show it. */
const OWNERS = [ROLES.TECH];
const READERS = [ROLES.TECH, ROLES.AI];

export interface AiModelPriceInput {
  model: string;
  inputPer1kUsd: number;
  outputPer1kUsd: number;
  active: boolean;
}

export interface AiSpendLimitInput {
  monthlyUsdCap: number;
  perUserDailyUsdCap: number;
  enabled: boolean;
}

/** A negative price or cap is a typo that would silently corrupt every later total. */
function assertNotNegative(values: Record<string, number>): void {
  for (const [label, value] of Object.entries(values)) {
    if (value < 0) {
      badRequest(`${label} cannot be negative`);
    }
  }
}

/**
 * Prices and budget caps, edited in Tech › Environment Variables › AI Pricing.
 *
 * Kept out of the generic CRUD kit because the limit is a singleton with no id, and a
 * price row is unique by model — both need a shape the kit does not offer.
 */
export const aiPricingResolvers = {
  Query: {
    listAiModelPrices: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, READERS);
      return withIds(await AiModelPriceModel.find().sort({ model: 1 }).lean());
    },

    /** The caps in force, so the AI overview can say what the ceiling is. */
    aiSpendLimit: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, READERS);
      return readAiSpendLimit();
    },
  },
  Mutation: {
    /**
     * Creates or corrects the price for one model. Upserted on the model name so the same
     * screen can add a model OpenAI has just published without a second code path.
     */
    saveAiModelPrice: async (
      _p: unknown,
      { input }: { input: AiModelPriceInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, OWNERS);
      const model = input.model.trim();
      if (!model) {
        badRequest('Name the model this price is for');
      }
      assertNotNegative({
        'The input price': input.inputPer1kUsd,
        'The output price': input.outputPer1kUsd,
      });
      const saved = await AiModelPriceModel.findOneAndUpdate(
        { model },
        { ...input, model },
        { new: true, upsert: true },
      ).lean();
      return { ...saved, id: String(saved._id) };
    },

    deleteAiModelPrice: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, OWNERS);
      await AiModelPriceModel.findByIdAndDelete(id);
      return true;
    },

    saveAiSpendLimit: async (
      _p: unknown,
      { input }: { input: AiSpendLimitInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, OWNERS);
      assertNotNegative({
        'The monthly cap': input.monthlyUsdCap,
        'The per-person daily cap': input.perUserDailyUsdCap,
      });
      return AiSpendLimitModel.findOneAndUpdate(
        { key: AI_SPEND_LIMIT_KEY },
        { ...input, key: AI_SPEND_LIMIT_KEY },
        { new: true, upsert: true },
      ).lean();
    },
  },
};
