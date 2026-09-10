import { UserModel } from '../admin/user.model';
import { notifyBestEffort } from '../notifications/notifications.service';

/**
 * Telling somebody their post was reacted to.
 *
 * Every function here is best-effort by construction. A feed reaction is the least
 * important write in the system, and a notification store having a bad moment must never
 * be the reason a like fails — the like is the thing the person asked for.
 */

/** Deep-links to the post itself, so the notification lands on the thread, not the feed. */
function postLink(postId: string): string {
  return `/social/posts/${postId}`;
}

/** The actor's own name, for a notification that reads like a sentence. */
async function nameOf(userId: string): Promise<string> {
  const user = await UserModel.findById(userId).select('name').lean();
  return user?.name ?? 'Someone';
}

/**
 * Notifies the author that their post was liked.
 *
 * Silent when you like your own post: a notification telling you what you just did is
 * noise, and it is the single most common way to generate one.
 */
export async function notifyPostLiked(
  authorId: string,
  actorId: string,
  postId: string,
): Promise<void> {
  if (authorId === actorId) return;
  await notifyBestEffort(authorId, {
    kind: 'SOCIAL_LIKE',
    title: `${await nameOf(actorId)} liked your post`,
    body: 'Someone reacted to what you shared on the company feed.',
    link: postLink(postId),
  });
}

/**
 * Notifies the author that somebody commented, with the comment itself as the body — the
 * point of the notification is usually the words, and making the reader open the thread to
 * find out whether it needs them is most of a notification's cost.
 */
export async function notifyPostCommented(
  authorId: string,
  actorId: string,
  postId: string,
  comment: string,
): Promise<void> {
  if (authorId === actorId) return;
  await notifyBestEffort(authorId, {
    kind: 'SOCIAL_COMMENT',
    title: `${await nameOf(actorId)} commented on your post`,
    body: comment,
    link: postLink(postId),
  });
}

/** Notifies the author that their post was shared onto the feed by somebody else. */
export async function notifyPostShared(
  authorId: string,
  actorId: string,
  postId: string,
): Promise<void> {
  if (authorId === actorId) return;
  await notifyBestEffort(authorId, {
    kind: 'SOCIAL_SHARE',
    title: `${await nameOf(actorId)} shared your post`,
    body: 'Your post was shared with the company feed.',
    link: postLink(postId),
  });
}
