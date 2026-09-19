import { randomUUID } from 'node:crypto';
import { badRequest, notFound } from '../../utils/errors';
import { NETWORKS } from './networks';
import { SocialAccountModel } from './social.models';
import { SocialMediaPostModel } from './social-post.model';
import { ruleProblem, type Draft } from './social.rules';
import { accessTokenOf } from './social.tokens';

export interface ComposeInput extends Draft {
  accountIds: string[];
  /** When to publish; null publishes now. */
  scheduledAt?: Date | null;
  /** Keep as a draft rather than publish or schedule. */
  draft?: boolean;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Publishes one claimed (PUBLISHING) post and records the outcome on it. */
export async function deliver(postId: string): Promise<void> {
  const post = await SocialMediaPostModel.findById(postId).lean();
  if (!post) return;
  const account = await SocialAccountModel.findById(post.accountId).lean();
  const client = NETWORKS[post.network];
  try {
    if (!account) throw new Error('The account was disconnected before the post went out.');
    if (!client.publish) throw new Error(`${post.network} does not take posts from here.`);
    const result = await client.publish(
      { externalId: account.externalId, accessToken: await accessTokenOf(account) },
      { text: post.text, mediaUrl: post.mediaUrl, link: post.link },
    );
    await SocialMediaPostModel.updateOne(
      { _id: postId },
      {
        $set: {
          status: 'PUBLISHED',
          externalId: result.externalId,
          permalink: result.permalink,
          publishedAt: new Date(),
          error: '',
        },
      },
    );
  } catch (error) {
    await SocialMediaPostModel.updateOne(
      { _id: postId },
      { $set: { status: 'FAILED', error: messageOf(error) } },
    );
  }
}

/** Checks the draft against every chosen account's network before anything is created. */
async function assertPublishable(input: ComposeInput) {
  if (input.accountIds.length === 0) badRequest('Choose at least one account');
  const accounts = await SocialAccountModel.find({ _id: { $in: input.accountIds } }).lean();
  if (accounts.length !== new Set(input.accountIds).size) notFound('Social account');
  const problems = accounts
    .map((account) => ruleProblem(account.network, input))
    .filter((problem): problem is string => problem !== null);
  if (problems.length > 0) badRequest(problems.join(' '));
  if (input.scheduledAt && input.scheduledAt.getTime() <= Date.now()) {
    badRequest('Pick a time in the future to schedule the post');
  }
  return accounts;
}

/**
 * Writes one post per chosen account — a draft, scheduled, or published straight away. A post
 * published now is attempted before this returns, so the composer can show which accounts took
 * it and which refused.
 */
export async function composePosts(input: ComposeInput, userId: string) {
  const accounts = await assertPublishable(input);
  const batchId = randomUUID();
  let status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' = 'PUBLISHING';
  if (input.draft) status = 'DRAFT';
  else if (input.scheduledAt) status = 'SCHEDULED';
  const created = await SocialMediaPostModel.insertMany(
    accounts.map((account) => ({
      accountId: String(account._id),
      network: account.network,
      app: account.app,
      origin: 'COMPOSED',
      status,
      text: input.text.trim(),
      mediaUrl: input.mediaUrl.trim(),
      link: input.link.trim(),
      scheduledAt: input.scheduledAt ?? null,
      batchId,
      createdBy: userId,
    })),
  );
  if (status === 'PUBLISHING') {
    await Promise.all(created.map((post) => deliver(String(post._id))));
  }
  return SocialMediaPostModel.find({ batchId }).lean();
}

/** A composed post that has not gone out yet: the only kind that can be edited or removed. */
async function unsentPost(id: string) {
  const post = await SocialMediaPostModel.findById(id).lean();
  if (!post) notFound('Social post');
  if (post.origin !== 'COMPOSED' || !['DRAFT', 'SCHEDULED', 'FAILED'].includes(post.status)) {
    badRequest('Only a draft, scheduled or failed post can be changed here');
  }
  return post;
}

/** Changes an unsent post's text, image, link or time — or moves a draft onto the schedule. */
export async function updatePost(id: string, draft: Draft & { scheduledAt?: Date | null }) {
  const post = await unsentPost(id);
  const problem = ruleProblem(post.network, draft);
  if (problem) badRequest(problem);
  if (draft.scheduledAt && draft.scheduledAt.getTime() <= Date.now()) {
    badRequest('Pick a time in the future to schedule the post');
  }
  let status = post.status;
  if (draft.scheduledAt) status = 'SCHEDULED';
  else if (post.status === 'SCHEDULED') status = 'DRAFT';
  const updated = await SocialMediaPostModel.findByIdAndUpdate(
    id,
    {
      $set: {
        text: draft.text.trim(),
        mediaUrl: draft.mediaUrl.trim(),
        link: draft.link.trim(),
        scheduledAt: draft.scheduledAt ?? null,
        status,
        error: '',
      },
    },
    { new: true },
  ).lean();
  if (!updated) notFound('Social post');
  return updated;
}

/** Publishes an unsent post now — a draft, a scheduled one ahead of time, or a retry. */
export async function publishNow(id: string) {
  await unsentPost(id);
  await SocialMediaPostModel.updateOne({ _id: id }, { $set: { status: 'PUBLISHING', error: '' } });
  await deliver(id);
  const sent = await SocialMediaPostModel.findById(id).lean();
  if (!sent) notFound('Social post');
  return sent;
}

export async function deletePost(id: string): Promise<boolean> {
  await unsentPost(id);
  await SocialMediaPostModel.deleteOne({ _id: id });
  return true;
}

/**
 * Publishes every scheduled post that is due. Each is claimed (SCHEDULED → PUBLISHING) in one
 * atomic step first, so two servers ticking at once never publish the same post twice.
 */
export async function publishDuePosts(now = new Date()): Promise<number> {
  let published = 0;
  for (;;) {
    const claimed = await SocialMediaPostModel.findOneAndUpdate(
      { status: 'SCHEDULED', scheduledAt: { $lte: now } },
      { $set: { status: 'PUBLISHING' } },
      { new: true, sort: { scheduledAt: 1 } },
    ).lean();
    if (!claimed) return published;
    await deliver(String(claimed._id));
    published += 1;
  }
}
