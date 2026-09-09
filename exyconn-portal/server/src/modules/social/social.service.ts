import { isValidObjectId } from 'mongoose';
import { UserModel } from '../admin/user.model';
import { badRequest, notFound } from '../../utils/errors';
import { SocialCommentModel, SocialLikeModel, SocialPostModel } from './social.model';
import { presentComments, presentPosts, type PresentedPost, type Viewer } from './social.present';
import { notifyPostCommented, notifyPostLiked, notifyPostShared } from './social.notify';

/** What the feed does, independent of who asked over GraphQL. */

/** A page of twenty is what fits on a screen; fifty is as much as one request may ask for. */
const DEFAULT_PAGE = 20;
const MAX_PAGE = 50;

/** One page of posts and where the next one starts, or null when this was the last. */
export interface FeedPage {
  posts: PresentedPost[];
  nextCursor: string | null;
}

function pageSize(limit?: number | null): number {
  return Math.min(Math.max(limit ?? DEFAULT_PAGE, 1), MAX_PAGE);
}

/**
 * Paged newest-first by `_id` rather than by `createdAt`.
 *
 * An ObjectId opens with the second it was minted, so descending `_id` is descending time
 * anyway — and unlike a timestamp it is unique, so two posts made in the same second
 * cannot straddle a page boundary and be served twice or skipped.
 */
async function page(
  filter: Record<string, unknown>,
  viewer: Viewer,
  limit?: number | null,
  cursor?: string | null,
): Promise<FeedPage> {
  const size = pageSize(limit);
  const query = { ...filter, ...(cursor ? { _id: { $lt: cursor } } : {}) };
  // One row past the page, so "is there more" needs no second count query.
  const rows = await SocialPostModel.find(query)
    .sort({ _id: -1 })
    .limit(size + 1)
    .lean();
  const hasMore = rows.length > size;
  const posts = await presentPosts(rows.slice(0, size) as never, viewer);
  return { posts, nextCursor: hasMore ? posts[posts.length - 1].id : null };
}

export function feed(viewer: Viewer, limit?: number | null, cursor?: string | null) {
  return page({}, viewer, limit, cursor);
}

export function userPosts(
  userId: string,
  viewer: Viewer,
  limit?: number | null,
  cursor?: string | null,
) {
  return page({ authorId: userId }, viewer, limit, cursor);
}

/** One post, presented. Throws rather than returning null: the caller asked for a page. */
export async function post(id: string, viewer: Viewer): Promise<PresentedPost> {
  if (!isValidObjectId(id)) notFound('Post');
  const row = await SocialPostModel.findById(id).lean();
  if (!row) notFound('Post');
  const [presented] = await presentPosts([row] as never, viewer);
  return presented;
}

export async function comments(postId: string, viewer: Viewer) {
  const rows = await SocialCommentModel.find({ postId }).sort({ _id: 1 }).lean();
  return presentComments(rows as never, viewer);
}

/** A post with nothing in it is a misfire, not a post. */
function assertBody(body: string, what: string): string {
  const trimmed = body.trim();
  if (!trimmed) badRequest(`A ${what} cannot be empty`);
  return trimmed;
}

export async function createPost(
  input: { body: string; imageUrl?: string | null },
  viewer: Viewer,
): Promise<PresentedPost> {
  const created = await SocialPostModel.create({
    authorId: viewer.userId,
    body: assertBody(input.body, 'post'),
    imageUrl: input.imageUrl ?? '',
  });
  return post(String(created._id), viewer);
}

/**
 * Deletes a post and everything hanging off it.
 *
 * The likes and comments go too — left behind they would be rows pointing at nothing,
 * and a like row that outlives its post is a like the author can never place again,
 * because the unique index still remembers it.
 */
export async function deletePost(id: string, viewer: Viewer): Promise<boolean> {
  const row = await SocialPostModel.findById(id).lean();
  if (!row) notFound('Post');
  if (!viewer.isAdmin && row.authorId !== viewer.userId) {
    badRequest('You can only delete your own posts');
  }
  await Promise.all([
    SocialPostModel.deleteOne({ _id: id }),
    SocialCommentModel.deleteMany({ postId: id }),
    SocialLikeModel.deleteMany({ postId: id }),
  ]);
  if (row.sharedFromId) {
    await SocialPostModel.updateOne({ _id: row.sharedFromId }, { $inc: { shareCount: -1 } });
  }
  return true;
}

/**
 * Likes a post, or takes the like back.
 *
 * The counter moves in the same breath as the like row, and only when that row actually
 * appeared or disappeared — `deletedCount` and the unique index between them mean a
 * double tap changes the count once.
 */
export async function toggleLike(id: string, viewer: Viewer): Promise<PresentedPost> {
  const row = await SocialPostModel.findById(id).select('authorId').lean();
  if (!row) notFound('Post');
  const removed = await SocialLikeModel.deleteOne({ postId: id, userId: viewer.userId });
  if (removed.deletedCount > 0) {
    await SocialPostModel.updateOne({ _id: id }, { $inc: { likeCount: -1 } });
    return post(id, viewer);
  }
  await SocialLikeModel.create({ postId: id, userId: viewer.userId });
  await SocialPostModel.updateOne({ _id: id }, { $inc: { likeCount: 1 } });
  // Only the like tells the author something; taking one back is not news, and notifying
  // on both halves would make an unlike-relike pair a way to buzz somebody repeatedly.
  await notifyPostLiked(row.authorId, viewer.userId, id);
  return post(id, viewer);
}

/**
 * Shares a post onto the feed.
 *
 * Sharing a share records the root post, not the share — otherwise the feed grows chains
 * of shares of shares, each one a further step from the person who actually wrote it.
 */
export async function sharePost(
  id: string,
  body: string | null | undefined,
  viewer: Viewer,
): Promise<PresentedPost> {
  const row = await SocialPostModel.findById(id).lean();
  if (!row) notFound('Post');
  const rootId = row.sharedFromId ?? id;
  const created = await SocialPostModel.create({
    authorId: viewer.userId,
    body: body?.trim() ?? '',
    sharedFromId: rootId,
  });
  await SocialPostModel.updateOne({ _id: rootId }, { $inc: { shareCount: 1 } });
  // The root's author is the one who wrote it, and the one a share is news for — not the
  // author of the share this one was made from.
  const root = await SocialPostModel.findById(rootId).select('authorId').lean();
  if (root) await notifyPostShared(root.authorId, viewer.userId, rootId);
  return post(String(created._id), viewer);
}

export async function createComment(postId: string, body: string, viewer: Viewer) {
  const row = await SocialPostModel.findById(postId).select('authorId').lean();
  if (!row) notFound('Post');
  const text = assertBody(body, 'comment');
  const created = await SocialCommentModel.create({
    postId,
    authorId: viewer.userId,
    body: text,
  });
  await SocialPostModel.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });
  await notifyPostCommented(row.authorId, viewer.userId, postId, text);
  const [presented] = await presentComments([created.toObject()] as never, viewer);
  return presented;
}

export async function deleteComment(id: string, viewer: Viewer): Promise<boolean> {
  const row = await SocialCommentModel.findById(id).lean();
  if (!row) notFound('Comment');
  if (!viewer.isAdmin && row.authorId !== viewer.userId) {
    badRequest('You can only delete your own comments');
  }
  await SocialCommentModel.deleteOne({ _id: id });
  await SocialPostModel.updateOne({ _id: row.postId }, { $inc: { commentCount: -1 } });
  return true;
}

/**
 * A colleague's profile: the directory record everyone may see, plus what the feed knows
 * about them — how much they have posted and how much of it landed.
 */
export async function profile(userId: string, _viewer: Viewer) {
  if (!isValidObjectId(userId)) notFound('Employee');
  const user = await UserModel.findById(userId)
    .select('name email avatarUrl designation department brief joinDate')
    .lean();
  if (!user) notFound('Employee');

  const [postCount, likes] = await Promise.all([
    SocialPostModel.countDocuments({ authorId: userId }),
    SocialPostModel.aggregate<{ total: number }>([
      { $match: { authorId: userId } },
      { $group: { _id: null, total: { $sum: '$likeCount' } } },
    ]),
  ]);

  return {
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      designation: user.designation ?? null,
      department: user.department ?? null,
    },
    brief: user.brief ?? null,
    joinDate: user.joinDate ?? null,
    postCount,
    likesReceived: likes[0]?.total ?? 0,
  };
}
