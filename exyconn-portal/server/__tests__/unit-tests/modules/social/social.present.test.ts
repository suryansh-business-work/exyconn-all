import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { SocialPostModel } from '../../../../src/modules/social/social.model';
import { presentPosts } from '../../../../src/modules/social/social.present';
import { notifyPostLiked } from '../../../../src/modules/social/social.notify';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { NotificationModel } from '../../../../src/modules/notifications';
import { ROLES } from '../../../../src/constants/roles';
import { seedUser } from '../../../helpers';

async function employee(email: string): Promise<string> {
  const user = await seedUser(email, `pw-${randomUUID()}`, [ROLES.EMPLOYEE]);
  return String(user._id);
}

describe('presenting posts', () => {
  it('gives a post stored without an image an empty image, never undefined', async () => {
    const ravi = await employee('ravi@exyconn.com');
    const row = {
      _id: new Types.ObjectId(),
      authorId: ravi,
      body: 'Old post',
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      createdAt: new Date(),
    };

    const [presented] = await presentPosts([row], { userId: ravi, isAdmin: false });

    expect(presented.imageUrl).toBe('');
    expect(presented.canDelete).toBe(true);
    expect(presented.sharedFrom).toBeNull();
  });

  it('bylines with the author’s picture and department when the directory has them', async () => {
    const ravi = await employee('ravi@exyconn.com');
    await UserModel.updateOne(
      { _id: ravi },
      { avatarUrl: 'https://img/r.png', department: 'Engineering' },
    );
    const created = await SocialPostModel.create({ authorId: ravi, body: 'Hello' });

    const [presented] = await presentPosts([created.toObject()] as never, {
      userId: 'someone-else',
      isAdmin: true,
    });

    expect(presented.author).toMatchObject({
      id: ravi,
      avatarUrl: 'https://img/r.png',
      department: 'Engineering',
      designation: null,
    });
    expect(presented.canDelete).toBe(true);
  });
});

describe('social notifications for an unknown actor', () => {
  it('names somebody the directory no longer has as Someone', async () => {
    const ravi = await employee('ravi@exyconn.com');
    const postId = new Types.ObjectId().toHexString();

    await notifyPostLiked(ravi, new Types.ObjectId().toHexString(), postId);

    const [note] = await NotificationModel.find({ employeeId: ravi }).lean();
    expect(note.title).toBe('Someone liked your post');
    expect(note.link).toBe(`/social/posts/${postId}`);
  });
});
