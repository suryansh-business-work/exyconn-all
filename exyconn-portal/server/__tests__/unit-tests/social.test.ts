import { socialResolvers } from '../../src/modules/social';
import { SocialLikeModel, SocialPostModel } from '../../src/modules/social/social.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<never>;
const Q = socialResolvers.Query as unknown as Record<string, Resolver>;
const M = socialResolvers.Mutation as unknown as Record<string, Resolver>;

interface Post {
  id: string;
  body: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  canDelete: boolean;
  author: { id: string; name: string; designation: string | null };
  sharedFrom: { id: string; body: string; author: { id: string } } | null;
}

interface Page {
  posts: Post[];
  nextCursor: string | null;
}

interface Comment {
  id: string;
  body: string;
  canDelete: boolean;
  author: { id: string };
}

/** A signed-in employee, as the resolvers see one. */
function ctx(id: string, roles: string[] = [ROLES.EMPLOYEE]): GraphQLContext {
  return { user: { id, email: `${id}@exyconn.com`, roles } } as unknown as GraphQLContext;
}

async function employee(email: string): Promise<string> {
  const user = await seedUser(email, 'whatever123', [ROLES.EMPLOYEE]);
  return String(user._id);
}

async function post(author: string, body: string): Promise<Post> {
  return M.createSocialPost(null, { input: { body } }, ctx(author));
}

describe('social feed', () => {
  let ravi = '';
  let asha = '';

  beforeEach(async () => {
    ravi = await employee('ravi@exyconn.com');
    asha = await employee('asha@exyconn.com');
  });

  it('publishes a post and puts it at the top of everybody’s feed', async () => {
    await post(ravi, 'First');
    await post(ravi, 'Second');

    const page: Page = await Q.socialFeed(null, {}, ctx(asha));
    expect(page.posts.map((p) => p.body)).toEqual(['Second', 'First']);
    expect(page.nextCursor).toBeNull();
  });

  it('refuses a post with nothing in it', async () => {
    await expect(M.createSocialPost(null, { input: { body: '   ' } }, ctx(ravi))).rejects.toThrow(
      'A post cannot be empty',
    );
  });

  it('bylines a post with who wrote it, not with who is reading it', async () => {
    await UserModel.updateOne({ _id: ravi }, { designation: 'Engineer' });
    await post(ravi, 'Hello');

    const page: Page = await Q.socialFeed(null, {}, ctx(asha));
    expect(page.posts[0].author.id).toBe(ravi);
    expect(page.posts[0].author.designation).toBe('Engineer');
  });

  it('pages from newest to oldest without repeating or skipping a post', async () => {
    for (const body of ['one', 'two', 'three']) {
      await post(ravi, body);
    }

    const first: Page = await Q.socialFeed(null, { limit: 2 }, ctx(asha));
    expect(first.posts.map((p) => p.body)).toEqual(['three', 'two']);
    expect(first.nextCursor).toBe(first.posts[1].id);

    const second: Page = await Q.socialFeed(
      null,
      { limit: 2, cursor: first.nextCursor },
      ctx(asha),
    );
    expect(second.posts.map((p) => p.body)).toEqual(['one']);
    expect(second.nextCursor).toBeNull();
  });
});

describe('social likes', () => {
  let ravi = '';
  let asha = '';

  beforeEach(async () => {
    ravi = await employee('ravi@exyconn.com');
    asha = await employee('asha@exyconn.com');
  });

  it('likes a post and takes the like back again', async () => {
    const created = await post(ravi, 'Ship day');

    const liked: Post = await M.toggleSocialPostLike(null, { id: created.id }, ctx(asha));
    expect(liked.likeCount).toBe(1);
    expect(liked.likedByMe).toBe(true);

    const unliked: Post = await M.toggleSocialPostLike(null, { id: created.id }, ctx(asha));
    expect(unliked.likeCount).toBe(0);
    expect(unliked.likedByMe).toBe(false);
    expect(await SocialLikeModel.countDocuments({ postId: created.id })).toBe(0);
  });

  it('shows a like to the person who left it and not to anybody else', async () => {
    const created = await post(ravi, 'Ship day');
    await M.toggleSocialPostLike(null, { id: created.id }, ctx(asha));

    const mine: Page = await Q.socialFeed(null, {}, ctx(asha));
    const theirs: Page = await Q.socialFeed(null, {}, ctx(ravi));
    expect(mine.posts[0].likedByMe).toBe(true);
    expect(theirs.posts[0].likedByMe).toBe(false);
    expect(theirs.posts[0].likeCount).toBe(1);
  });
});

describe('social comments', () => {
  let ravi = '';
  let asha = '';

  beforeEach(async () => {
    ravi = await employee('ravi@exyconn.com');
    asha = await employee('asha@exyconn.com');
  });

  it('adds a comment and moves the count on the post with it', async () => {
    const created = await post(ravi, 'Ship day');
    await M.createSocialComment(null, { postId: created.id, body: 'Congratulations' }, ctx(asha));

    const comments: Comment[] = await Q.socialComments(null, { postId: created.id }, ctx(ravi));
    expect(comments).toHaveLength(1);
    expect(comments[0].body).toBe('Congratulations');

    const reloaded: Post = await Q.socialPost(null, { id: created.id }, ctx(ravi));
    expect(reloaded.commentCount).toBe(1);
  });

  it('lets a commenter delete their own comment and nobody else’s', async () => {
    const created = await post(ravi, 'Ship day');
    const comment: Comment = await M.createSocialComment(
      null,
      { postId: created.id, body: 'Congratulations' },
      ctx(asha),
    );

    const asRavi: Comment[] = await Q.socialComments(null, { postId: created.id }, ctx(ravi));
    expect(asRavi[0].canDelete).toBe(false);

    await expect(M.deleteSocialComment(null, { id: comment.id }, ctx(ravi))).rejects.toThrow(
      'You can only delete your own comments',
    );

    await M.deleteSocialComment(null, { id: comment.id }, ctx(asha));
    const reloaded: Post = await Q.socialPost(null, { id: created.id }, ctx(ravi));
    expect(reloaded.commentCount).toBe(0);
  });
});

describe('social shares', () => {
  let ravi = '';
  let asha = '';

  beforeEach(async () => {
    ravi = await employee('ravi@exyconn.com');
    asha = await employee('asha@exyconn.com');
  });

  it('shares a post onto the feed, quoting the original rather than copying it', async () => {
    const original = await post(ravi, 'Ship day');
    const shared: Post = await M.shareSocialPost(
      null,
      { id: original.id, body: 'Well done' },
      ctx(asha),
    );

    expect(shared.body).toBe('Well done');
    expect(shared.sharedFrom?.id).toBe(original.id);
    expect(shared.sharedFrom?.author.id).toBe(ravi);

    const reloaded: Post = await Q.socialPost(null, { id: original.id }, ctx(ravi));
    expect(reloaded.shareCount).toBe(1);
  });

  it('points a share of a share back at the post somebody actually wrote', async () => {
    const original = await post(ravi, 'Ship day');
    const firstShare: Post = await M.shareSocialPost(null, { id: original.id }, ctx(asha));
    const secondShare: Post = await M.shareSocialPost(null, { id: firstShare.id }, ctx(ravi));

    expect(secondShare.sharedFrom?.id).toBe(original.id);
    const reloaded: Post = await Q.socialPost(null, { id: original.id }, ctx(ravi));
    expect(reloaded.shareCount).toBe(2);
  });
});

describe('social deletion', () => {
  let ravi = '';
  let asha = '';

  beforeEach(async () => {
    ravi = await employee('ravi@exyconn.com');
    asha = await employee('asha@exyconn.com');
  });

  it('lets the author delete their post, and takes its likes and comments with it', async () => {
    const created = await post(ravi, 'Ship day');
    await M.toggleSocialPostLike(null, { id: created.id }, ctx(asha));
    await M.createSocialComment(null, { postId: created.id, body: 'Congratulations' }, ctx(asha));

    await M.deleteSocialPost(null, { id: created.id }, ctx(ravi));

    expect(await SocialPostModel.countDocuments({})).toBe(0);
    expect(await SocialLikeModel.countDocuments({})).toBe(0);
    const page: Page = await Q.socialFeed(null, {}, ctx(asha));
    expect(page.posts).toHaveLength(0);
  });

  it('refuses to let one employee delete another’s post', async () => {
    const created = await post(ravi, 'Ship day');
    await expect(M.deleteSocialPost(null, { id: created.id }, ctx(asha))).rejects.toThrow(
      'You can only delete your own posts',
    );
  });

  it('lets an administrator take anyone’s post down', async () => {
    const created = await post(ravi, 'Ship day');
    await M.deleteSocialPost(null, { id: created.id }, ctx(asha, [ROLES.ADMIN]));
    expect(await SocialPostModel.countDocuments({})).toBe(0);
  });

  it('gives the original its share back when a share is deleted', async () => {
    const original = await post(ravi, 'Ship day');
    const shared: Post = await M.shareSocialPost(null, { id: original.id }, ctx(asha));

    await M.deleteSocialPost(null, { id: shared.id }, ctx(asha));

    const reloaded: Post = await Q.socialPost(null, { id: original.id }, ctx(ravi));
    expect(reloaded.shareCount).toBe(0);
  });
});

describe('social profiles', () => {
  let ravi = '';
  let asha = '';

  beforeEach(async () => {
    ravi = await employee('ravi@exyconn.com');
    asha = await employee('asha@exyconn.com');
  });

  it('reports what the feed knows about a colleague', async () => {
    await UserModel.updateOne({ _id: ravi }, { designation: 'Engineer', brief: 'Builds things' });
    const first = await post(ravi, 'One');
    await post(ravi, 'Two');
    await M.toggleSocialPostLike(null, { id: first.id }, ctx(asha));

    const profile: {
      user: { id: string; designation: string | null };
      brief: string | null;
      postCount: number;
      likesReceived: number;
    } = await Q.socialProfile(null, { userId: ravi }, ctx(asha));

    expect(profile.user.designation).toBe('Engineer');
    expect(profile.brief).toBe('Builds things');
    expect(profile.postCount).toBe(2);
    expect(profile.likesReceived).toBe(1);
  });

  it('returns only that colleague’s posts', async () => {
    await post(ravi, 'Mine');
    await post(asha, 'Hers');

    const page: Page = await Q.socialUserPosts(null, { userId: ravi }, ctx(asha));
    expect(page.posts.map((p) => p.body)).toEqual(['Mine']);
  });

  it('says so rather than failing when the profile is not a real employee', async () => {
    await expect(Q.socialProfile(null, { userId: 'not-an-id' }, ctx(asha))).rejects.toThrow(
      'Employee not found',
    );
  });

  it('keeps a thread readable after its author’s account is gone', async () => {
    const created = await post(ravi, 'Ship day');
    await UserModel.deleteOne({ _id: ravi });

    const reloaded: Post = await Q.socialPost(null, { id: created.id }, ctx(asha));
    expect(reloaded.author.name).toBe('Former colleague');
    expect(reloaded.body).toBe('Ship day');
  });
});
