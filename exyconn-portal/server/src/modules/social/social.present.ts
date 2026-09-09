import { UserModel } from '../admin/user.model';
import { SocialLikeModel, SocialPostModel } from './social.model';

/**
 * Turns stored rows into what the feed returns.
 *
 * Everything here is written to work on a whole page at once. A feed page is twenty posts,
 * each needing an author, a like state and possibly an original it shares; resolved one
 * post at a time that is sixty round trips to render one screen, and it gets worse as
 * people use the thing. Batched, it is three, whatever the page size.
 */

/** Who the viewer is, and whether the rules bend for them. */
export interface Viewer {
  userId: string;
  isAdmin: boolean;
}

interface PostRow {
  _id: unknown;
  authorId: string;
  body: string;
  imageUrl?: string;
  sharedFromId?: string | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
}

interface CommentRow {
  _id: unknown;
  postId: string;
  authorId: string;
  body: string;
  createdAt: Date;
}

export interface PresentedAuthor {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  designation: string | null;
  department: string | null;
}

export interface PresentedPost {
  id: string;
  author: PresentedAuthor;
  body: string;
  imageUrl: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  canDelete: boolean;
  sharedFrom: PresentedPost | null;
  createdAt: Date;
}

/**
 * A byline for somebody the directory no longer has.
 *
 * An account can be deleted while their posts stay on the feed, and a thread that
 * disappears because one participant left is worse than one with a nameless line in it.
 */
const FORMER_COLLEAGUE: Omit<PresentedAuthor, 'id'> = {
  name: 'Former colleague',
  email: '',
  avatarUrl: null,
  designation: null,
  department: null,
};

/** Bylines for a set of people, in one query. */
async function loadAuthors(ids: string[]): Promise<Map<string, PresentedAuthor>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const users = await UserModel.find({ _id: { $in: unique } })
    .select('name email avatarUrl designation department')
    .lean();
  return new Map(
    users.map((user) => [
      String(user._id),
      {
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
        designation: user.designation ?? null,
        department: user.department ?? null,
      },
    ]),
  );
}

function authorOf(authors: Map<string, PresentedAuthor>, id: string): PresentedAuthor {
  return authors.get(id) ?? { id, ...FORMER_COLLEAGUE };
}

/** Which of these posts the viewer has already liked, in one query. */
async function loadLiked(postIds: string[], viewer: Viewer): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const likes = await SocialLikeModel.find({ postId: { $in: postIds }, userId: viewer.userId })
    .select('postId')
    .lean();
  return new Set(likes.map((like) => like.postId));
}

/** Only the author may take their own words down; an administrator may take anyone's. */
function canDelete(viewer: Viewer, authorId: string): boolean {
  return viewer.isAdmin || authorId === viewer.userId;
}

function toPost(
  row: PostRow,
  authors: Map<string, PresentedAuthor>,
  liked: Set<string>,
  viewer: Viewer,
  sharedFrom: PresentedPost | null,
): PresentedPost {
  const id = String(row._id);
  return {
    id,
    author: authorOf(authors, row.authorId),
    body: row.body,
    imageUrl: row.imageUrl ?? '',
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    shareCount: row.shareCount,
    likedByMe: liked.has(id),
    canDelete: canDelete(viewer, row.authorId),
    sharedFrom,
    createdAt: row.createdAt,
  };
}

/**
 * Presents a page of posts, resolving each share's original alongside it.
 *
 * Only one level deep, which is all there ever is: sharing a share records the root as
 * the original, so a chain of shares cannot form and this cannot recurse.
 */
export async function presentPosts(rows: PostRow[], viewer: Viewer): Promise<PresentedPost[]> {
  const sharedIds = rows.map((row) => row.sharedFromId).filter((id): id is string => Boolean(id));
  const originals = sharedIds.length
    ? ((await SocialPostModel.find({ _id: { $in: [...new Set(sharedIds)] } }).lean()) as PostRow[])
    : [];

  const authors = await loadAuthors([...rows, ...originals].map((row) => row.authorId));
  const liked = await loadLiked(
    [...rows, ...originals].map((row) => String(row._id)),
    viewer,
  );

  const byId = new Map(
    originals.map((row) => [String(row._id), toPost(row, authors, liked, viewer, null)]),
  );
  return rows.map((row) =>
    toPost(row, authors, liked, viewer, byId.get(row.sharedFromId ?? '') ?? null),
  );
}

/** The same treatment for a post's comments: one query for every byline on the thread. */
export async function presentComments(rows: CommentRow[], viewer: Viewer) {
  const authors = await loadAuthors(rows.map((row) => row.authorId));
  return rows.map((row) => ({
    id: String(row._id),
    postId: row.postId,
    author: authorOf(authors, row.authorId),
    body: row.body,
    createdAt: row.createdAt,
    canDelete: canDelete(viewer, row.authorId),
  }));
}
