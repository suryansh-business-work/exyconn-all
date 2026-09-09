import { assertAuthenticated } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { socialTypeDefs } from './social.typeDefs';
import * as social from './social.service';
import type { Viewer } from './social.present';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * The internal social feed at social.exyconn.com.
 *
 * Every signed-in employee reads and writes it — there is no module role, because a feed
 * only half the company can see is a noticeboard, not a feed. What is guarded is
 * authorship: you may delete your own words, and an administrator may delete anyone's.
 */
function viewerOf(ctx: GraphQLContext): Viewer {
  const user = assertAuthenticated(ctx);
  return { userId: user.id, isAdmin: (user.roles ?? []).includes(ROLES.ADMIN) };
}

interface PageArgs {
  limit?: number | null;
  cursor?: string | null;
}

export const socialResolvers = {
  Query: {
    socialFeed: (_p: unknown, args: PageArgs, ctx: GraphQLContext) =>
      social.feed(viewerOf(ctx), args.limit, args.cursor),
    socialPost: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      social.post(id, viewerOf(ctx)),
    socialUserPosts: (_p: unknown, args: PageArgs & { userId: string }, ctx: GraphQLContext) =>
      social.userPosts(args.userId, viewerOf(ctx), args.limit, args.cursor),
    socialProfile: (_p: unknown, { userId }: { userId: string }, ctx: GraphQLContext) =>
      social.profile(userId, viewerOf(ctx)),
    socialComments: (_p: unknown, { postId }: { postId: string }, ctx: GraphQLContext) =>
      social.comments(postId, viewerOf(ctx)),
  },
  Mutation: {
    createSocialPost: (
      _p: unknown,
      { input }: { input: { body: string; imageUrl?: string | null } },
      ctx: GraphQLContext,
    ) => social.createPost(input, viewerOf(ctx)),
    deleteSocialPost: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      social.deletePost(id, viewerOf(ctx)),
    toggleSocialPostLike: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      social.toggleLike(id, viewerOf(ctx)),
    shareSocialPost: (
      _p: unknown,
      { id, body }: { id: string; body?: string | null },
      ctx: GraphQLContext,
    ) => social.sharePost(id, body, viewerOf(ctx)),
    createSocialComment: (
      _p: unknown,
      { postId, body }: { postId: string; body: string },
      ctx: GraphQLContext,
    ) => social.createComment(postId, body, viewerOf(ctx)),
    deleteSocialComment: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      social.deleteComment(id, viewerOf(ctx)),
  },
};

export { socialTypeDefs };
export { SocialPostModel, SocialCommentModel, SocialLikeModel } from './social.model';
