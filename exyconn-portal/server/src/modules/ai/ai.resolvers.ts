import { AiJobModel } from './ai.model';
import { PromptModel } from './prompt.model';
import { defaultAiModel, enqueueAiJob, listAiModels, type AiActor } from './ai.service';
import { aiDraft, aiSummarise, type AiDraftKind, type SummaryStyle } from './ai.actions';
import { aiSpendSummary } from './ai.budget';
import { renderMergeFields, toValueMap, type PromptVariableInput } from './ai.mergeFields';
import { assertPermission } from '../../lib/permissions';
import type { PermissionAction } from '../permissions/permission.model';
import { withId } from '../../utils/serialize';
import { notFound } from '../../utils/errors';
import { ROLES } from '../../constants/roles';
import type { TokenPayload } from '../../utils/jwt';
import type { GraphQLContext } from '../../middleware/auth';

/** The AI role, then whatever the admin matrix leaves it on AiJob. */
const guard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, 'AiJob', [ROLES.AI], action);

/** Attribution comes from the token, never from the request body. */
const actorOf = (user: TokenPayload): AiActor => ({ id: user.id, name: user.email });

/** Custom AI resolvers: everything that actually talks to OpenAI. */
export const aiCustomResolvers = {
  Query: {
    /** The picker's options and its starting value, in one round trip. */
    aiModels: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      const [models, defaultModel] = await Promise.all([listAiModels(), defaultAiModel()]);
      return { models, defaultModel };
    },

    /** What AI cost over a window, and who and what it went on. */
    aiSpendSummary: async (
      _p: unknown,
      { from, to }: { from: Date; to: Date },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      return aiSpendSummary(new Date(from), new Date(to));
    },
  },
  Mutation: {
    /**
     * Queues the job and answers at once. The worker sends it; the grid polls until the
     * row settles. A run that blocked the request was fine at one job and painful at ten.
     */
    runAiJob: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const user = await guard(ctx, 'EDIT');
      return withId(await enqueueAiJob(id, actorOf(user)));
    },

    /**
     * Runs a prompt-library entry without making the user copy it into a job first, with
     * its `{{variables}}` filled from what they typed. The job is still created, so every
     * run is on the jobs grid with its own history.
     */
    runPrompt: async (
      _p: unknown,
      {
        id,
        model,
        variables,
      }: { id: string; model: string; variables?: PromptVariableInput[] | null },
      ctx: GraphQLContext,
    ) => {
      const user = await guard(ctx, 'EDIT');
      const prompt = await PromptModel.findById(id).lean();
      if (!prompt) notFound('Prompt');
      const actor = actorOf(user);
      const job = await AiJobModel.create({
        name: prompt.title,
        model,
        prompt: renderMergeFields(prompt.content, toValueMap(variables ?? [])),
        promptId: id,
        createdById: actor.id,
        createdByName: actor.name,
      });
      return withId(await enqueueAiJob(String(job._id), actor));
    },

    /** Generic assist: condense text the caller already has. */
    aiSummarise: async (
      _p: unknown,
      { text, style }: { text: string; style?: SummaryStyle | null },
      ctx: GraphQLContext,
    ) => aiSummarise(text, style ?? 'BRIEF', actorOf(await guard(ctx, 'EDIT'))),

    /** Generic assist: a first draft of one of a fixed set of documents. */
    aiDraft: async (
      _p: unknown,
      { kind, context }: { kind: AiDraftKind; context: string },
      ctx: GraphQLContext,
    ) => aiDraft(kind, context, actorOf(await guard(ctx, 'EDIT'))),
  },
};
