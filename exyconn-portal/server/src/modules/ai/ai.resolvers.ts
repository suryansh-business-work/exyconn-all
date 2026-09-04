import { AiJobModel } from './ai.model';
import { PromptModel } from './prompt.model';
import { defaultAiModel, listAiModels, runAiJob } from './ai.service';
import { assertRole } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { notFound } from '../../utils/errors';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.AI]);

/** Custom AI resolvers: everything that actually talks to OpenAI. */
export const aiCustomResolvers = {
  Query: {
    /** The picker's options and its starting value, in one round trip. */
    aiModels: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      guard(ctx);
      const [models, defaultModel] = await Promise.all([listAiModels(), defaultAiModel()]);
      return { models, defaultModel };
    },
  },
  Mutation: {
    runAiJob: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return withId(await runAiJob(id));
    },

    /**
     * Runs a prompt-library entry without making the user copy it into a job first.
     * The job is still created, so every run is on the jobs grid with its own history.
     */
    runPrompt: async (
      _p: unknown,
      { id, model }: { id: string; model: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const prompt = await PromptModel.findById(id).lean();
      if (!prompt) notFound('Prompt');
      const job = await AiJobModel.create({
        name: prompt.title,
        model,
        prompt: prompt.content,
        promptId: id,
      });
      return withId(await runAiJob(String(job._id)));
    },
  },
};
