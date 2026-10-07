import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { socialResolvers } from '../../../../src/modules/social';
import { SocialPostModel } from '../../../../src/modules/social/social.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { NotificationModel } from '../../../../src/modules/notifications';
import { ROLES } from '../../../../src/constants/roles';
import { seedUser } from '../../../helpers';
import { codeOf } from '../codeOf';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<never>;
const Q = socialResolvers.Query as unknown as Record<string, Resolver>;
const M = socialResolvers.Mutation as unknown as Record<string, Resolver>;

interface Post {
  id: string;
  body: string;
  imageUrl: string;
  canDelete: boolean;
  shareCount: number;
  sharedFrom: { id: string } | null;
}

function ctx(id: string, roles: string[] = [ROLES.EMPLOYEE]): GraphQLContext {
  return { user: { id, email: `${id}@exyconn.com`, roles } } as unknown as GraphQLContext;
}

async function employee(email: string): Promise<string> {
  const user = await seedUser(email, `pw-${randomUUID()}`, [ROLES.EMPLOYEE]);
  return String(user._id);
}

const missingId = () => new Types.ObjectId().toHexString();

describe('social feed: who is asking', () => {
  it('refuses a caller who is not signed in', async () => {
    // The resolver refuses before it returns a promise, so it is called inside one.
    const attempt = Promise.resolve().then(() => Q.socialFeed(null, {}, {} as GraphQLContext));
    expect(await codeOf(attempt)).toBe('UNAUTHENTICATED');
  });

  it('treats a caller with no roles as an ordinary employee', async () => {
    const ravi = await employee('ravi@exyconn.com');
    await M.createSocialPost(null, { input: { body: 'Mine' } }, ctx(ravi));
    const stranger = { user: { id: missingId(), email: 'x@exyconn.com' } } as GraphQLContext;

    const page: { posts: Post[] } = await Q.socialFeed(null, {}, stranger);

    expect(page.posts).toHaveLength(1);
    expect(page.posts[0].canDelete).toBe(false);
  });
});

describe('social feed: paging limits', () => {
  it('serves at least one post when asked for none, and at most what exists', async () => {
    const ravi = await employee('ravi@exyconn.com');
    for (const body of ['one', 'two']) {
      await M.createSocialPost(null, { input: { body } }, ctx(ravi));
    }

    const tiny: { posts: Post[]; nextCursor: string | null } = await Q.socialFeed(
      null,
      { limit: 0 },
      ctx(ravi),
    );
    expect(tiny.posts.map((p) => p.body)).toEqual(['two']);
    expect(tiny.nextCursor).toBe(tiny.posts[0].id);

    const huge: { posts: Post[] } = await Q.socialUserPosts(
      null,
      { userId: ravi, limit: 1000 },
      ctx(ravi),
    );
    expect(huge.posts).toHaveLength(2);
  });
});

describe('social posts that are not there', () => {
  let ravi = '';
  beforeEach(async () => {
    ravi = await employee('ravi@exyconn.com');
  });

  it('says a post is not found for a malformed id and for an unknown one', async () => {
    expect(await codeOf(Q.socialPost(null, { id: 'nope' }, ctx(ravi)))).toBe('NOT_FOUND');
    expect(await codeOf(Q.socialPost(null, { id: missingId() }, ctx(ravi)))).toBe('NOT_FOUND');
  });

  it('refuses to delete, like, share or comment on a post that is gone', async () => {
    const id = missingId();
    expect(await codeOf(M.deleteSocialPost(null, { id }, ctx(ravi)))).toBe('NOT_FOUND');
    expect(await codeOf(M.toggleSocialPostLike(null, { id }, ctx(ravi)))).toBe('NOT_FOUND');
    expect(await codeOf(M.shareSocialPost(null, { id }, ctx(ravi)))).toBe('NOT_FOUND');
    expect(await codeOf(M.createSocialComment(null, { postId: id, body: 'Hi' }, ctx(ravi)))).toBe(
      'NOT_FOUND',
    );
    expect(await codeOf(M.deleteSocialComment(null, { id }, ctx(ravi)))).toBe('NOT_FOUND');
  });
});

describe('social posts and comments: content', () => {
  let ravi = '';
  let asha = '';
  beforeEach(async () => {
    ravi = await employee('ravi@exyconn.com');
    asha = await employee('asha@exyconn.com');
  });

  it('keeps the image a post was made with', async () => {
    const created: Post = await M.createSocialPost(
      null,
      { input: { body: 'Look', imageUrl: 'https://ik.imagekit.io/x/a.png' } },
      ctx(ravi),
    );
    expect(created.imageUrl).toBe('https://ik.imagekit.io/x/a.png');
  });

  it('refuses an empty comment, and trims what a share adds', async () => {
    const original: Post = await M.createSocialPost(null, { input: { body: 'Hi' } }, ctx(ravi));
    await expect(
      M.createSocialComment(null, { postId: original.id, body: '  ' }, ctx(asha)),
    ).rejects.toThrow('A comment cannot be empty');

    const shared: Post = await M.shareSocialPost(
      null,
      { id: original.id, body: '  Well done  ' },
      ctx(asha),
    );
    expect(shared.body).toBe('Well done');
  });

  it('lets an administrator remove anybody’s comment', async () => {
    const original: Post = await M.createSocialPost(null, { input: { body: 'Hi' } }, ctx(ravi));
    const comment: { id: string } = await M.createSocialComment(
      null,
      { postId: original.id, body: 'Nice' },
      ctx(asha),
    );

    expect(await M.deleteSocialComment(null, { id: comment.id }, ctx(ravi, [ROLES.ADMIN]))).toBe(
      true,
    );
    const comments: unknown[] = await Q.socialComments(null, { postId: original.id }, ctx(ravi));
    expect(comments).toEqual([]);
  });
});

describe('social shares of a deleted original', () => {
  it('still shares, quotes nothing, and notifies nobody', async () => {
    const ravi = await employee('ravi@exyconn.com');
    const asha = await employee('asha@exyconn.com');
    const original: Post = await M.createSocialPost(null, { input: { body: 'Hi' } }, ctx(ravi));
    const firstShare: Post = await M.shareSocialPost(null, { id: original.id }, ctx(asha));
    await SocialPostModel.deleteOne({ _id: original.id });

    const second: Post = await M.shareSocialPost(null, { id: firstShare.id }, ctx(asha));

    expect(second.sharedFrom).toBeNull();
    expect(await SocialPostModel.countDocuments({ sharedFromId: original.id })).toBe(2);
    // Only the first share reached Ravi; the second had no surviving original to tell him about.
    expect(await NotificationModel.countDocuments({ employeeId: ravi })).toBe(1);
  });
});

describe('social profiles: edges', () => {
  it('says not found for a well-formed id nobody has', async () => {
    const ravi = await employee('ravi@exyconn.com');
    expect(await codeOf(Q.socialProfile(null, { userId: missingId() }, ctx(ravi)))).toBe(
      'NOT_FOUND',
    );
  });

  it('reports a colleague who has posted nothing, with the whole directory card', async () => {
    const ravi = await employee('ravi@exyconn.com');
    const joinDate = new Date('2024-01-15T00:00:00Z');
    await UserModel.updateOne(
      { _id: ravi },
      { avatarUrl: 'https://img/r.png', department: 'Engineering', joinDate },
    );

    const profile: {
      user: { avatarUrl: string | null; department: string | null };
      brief: string | null;
      joinDate: Date | null;
      postCount: number;
      likesReceived: number;
    } = await Q.socialProfile(null, { userId: ravi }, ctx(ravi));

    expect(profile.user).toMatchObject({
      avatarUrl: 'https://img/r.png',
      department: 'Engineering',
    });
    expect(profile.brief).toBeNull();
    expect(profile.joinDate).toEqual(joinDate);
    expect(profile.postCount).toBe(0);
    expect(profile.likesReceived).toBe(0);
  });
});
