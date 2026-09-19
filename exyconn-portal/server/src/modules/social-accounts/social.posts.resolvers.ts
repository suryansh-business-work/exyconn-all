import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { badRequest } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import { SocialMediaPostModel, type PostStatus } from './social-post.model';
import { NETWORK_RULES, type Draft } from './social.rules';
import {
  composePosts,
  deletePost,
  publishNow,
  updatePost,
  type ComposeInput,
} from './social.publish';
import { syncAccount, syncAllAccounts } from './social.sync';
import { socialAnalytics } from './social.analytics';
import { analysePosts, postIdeas } from './social.ai';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.MARKETING]);
const MAX_LIST = 500;
const MAX_DAYS = 365;
const MAX_CALENDAR_DAYS = 62;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The AI assists are billed to the person who asked, named as the AI module names them. */
const actorOf = (ctx: GraphQLContext) => {
  const user = guard(ctx);
  return { id: user.id, name: user.email };
};

function assertDays(days: number): void {
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    badRequest(`The period must be between 1 and ${MAX_DAYS} days`);
  }
}

export const socialPostsResolvers = {
  Query: {
    socialMediaPosts: async (
      _p: unknown,
      args: { accountId?: string | null; status?: PostStatus | null; limit: number },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const filter = {
        ...(args.accountId ? { accountId: args.accountId } : {}),
        ...(args.status ? { status: args.status } : {}),
      };
      const rows = await SocialMediaPostModel.find(filter)
        .sort({ publishedAt: -1, scheduledAt: -1, createdAt: -1 })
        .limit(Math.min(Math.max(args.limit, 1), MAX_LIST))
        .lean();
      return withIds(rows);
    },
    socialCalendar: async (
      _p: unknown,
      { from, to }: { from: Date; to: Date },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      if (to <= from || to.getTime() - from.getTime() > MAX_CALENDAR_DAYS * MS_PER_DAY) {
        badRequest(`Ask for a range of up to ${MAX_CALENDAR_DAYS} days`);
      }
      const inRange = { $gte: from, $lt: to };
      const rows = await SocialMediaPostModel.find({
        $or: [{ scheduledAt: inRange }, { publishedAt: inRange }],
      })
        .sort({ scheduledAt: 1, publishedAt: 1 })
        .lean();
      return withIds(rows);
    },
    socialAnalytics: async (_p: unknown, { days }: { days: number }, ctx: GraphQLContext) => {
      guard(ctx);
      assertDays(days);
      return socialAnalytics(days);
    },
    socialNetworkRules: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      guard(ctx);
      return Object.values(NETWORK_RULES);
    },
  },
  Mutation: {
    syncSocialAccount: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return syncAccount(id);
    },
    syncAllSocialAccounts: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      guard(ctx);
      return syncAllAccounts();
    },
    composeSocialMediaPost: async (
      _p: unknown,
      { input }: { input: ComposeInput },
      ctx: GraphQLContext,
    ) => {
      const user = guard(ctx);
      return withIds(await composePosts(input, user.id));
    },
    updateSocialMediaPost: async (
      _p: unknown,
      { id, input }: { id: string; input: Draft & { scheduledAt?: Date | null } },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return withId(await updatePost(id, input));
    },
    publishSocialMediaPostNow: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return withId(await publishNow(id));
    },
    deleteSocialMediaPost: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return deletePost(id);
    },
    socialMediaInsights: async (_p: unknown, { days }: { days: number }, ctx: GraphQLContext) => {
      assertDays(days);
      return analysePosts(days, actorOf(ctx));
    },
    socialMediaIdeas: async (
      _p: unknown,
      { topic, count }: { topic: string; count: number },
      ctx: GraphQLContext,
    ) => postIdeas(topic, count, actorOf(ctx)),
  },
  SocialMediaPost: {
    engagement: (post: {
      metrics?: { likes?: number; comments?: number; shares?: number } | null;
    }) => (post.metrics?.likes ?? 0) + (post.metrics?.comments ?? 0) + (post.metrics?.shares ?? 0),
    metrics: (post: { metrics?: Record<string, number> | null }) => ({
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      ...post.metrics,
    }),
  },
};
