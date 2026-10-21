import { badRequest, notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';
import { recordAudit } from '../audit';
import { NETWORKS } from './networks';
import { SOCIAL_NETWORK_LABEL, type SocialNetwork } from './social.constants';
import { SocialProviderError } from './social.http';
import { SocialAccountModel } from './social.models';
import { SocialMediaPostModel } from './social-post.model';
import { accessTokenOf } from './social.tokens';

/** What deleting a published post did on one account. */
export type DeletionOutcome = 'DELETED' | 'KEPT_ON_NETWORK' | 'FAILED';

export interface PostDeletion {
  postId: string;
  accountId: string;
  network: SocialNetwork;
  outcome: DeletionOutcome;
  /** Said to the person: what happened, or the network's reason it did not. */
  message: string;
}

const NOT_FOUND = 404;

interface PublishedPost {
  _id: { toHexString: () => string };
  accountId: string;
  network: SocialNetwork;
  externalId?: string | null;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Deletes the post on its network. Already gone there (404) counts as deleted; any other
 * refusal is returned as the network's reason, and nothing is deleted here.
 */
async function removeOnNetwork(post: PublishedPost): Promise<string | null> {
  const remove = NETWORKS[post.network].remove;
  if (!remove || !post.externalId) return null;
  const account = await SocialAccountModel.findById(post.accountId).lean();
  if (!account) {
    return 'The account is no longer connected. Connect it again to delete the post on the network.';
  }
  try {
    await remove(
      {
        externalId: account.externalId,
        accessToken: await accessTokenOf(account),
        kind: account.kind ?? 'PERSON',
      },
      post.externalId,
    );
    return null;
  } catch (error) {
    if (error instanceof SocialProviderError && error.status === NOT_FOUND) return null;
    return messageOf(error);
  }
}

/** One account's post: deleted on the network, then here — or kept here when that failed. */
async function deleteOne(post: PublishedPost): Promise<PostDeletion> {
  const label = SOCIAL_NETWORK_LABEL[post.network];
  const base = { postId: post._id.toHexString(), accountId: post.accountId, network: post.network };
  if (!NETWORKS[post.network].remove) {
    // Kept as REMOVED rather than deleted, so the next sync does not bring it back.
    await SocialMediaPostModel.updateOne({ _id: post._id }, { $set: { status: 'REMOVED' } });
    return {
      ...base,
      outcome: 'KEPT_ON_NETWORK',
      message: `Removed from Exyconn. ${label} doesn't let apps delete posts. Delete it in the ${label} app.`,
    };
  }
  const refusal = await removeOnNetwork(post);
  if (refusal) return { ...base, outcome: 'FAILED', message: refusal };
  await SocialMediaPostModel.deleteOne({ _id: post._id });
  return { ...base, outcome: 'DELETED', message: `Deleted from ${label} and Exyconn.` };
}

/**
 * Deletes a published post from its network and from Exyconn — with every other account's
 * copy when it was written for several together. Each account is handled on its own, so one
 * network refusing never stops the others, and each outcome is audited and reported.
 */
export async function deletePublishedPost(
  id: string,
  ctx: GraphQLContext,
): Promise<PostDeletion[]> {
  const post = await SocialMediaPostModel.findById(id).lean();
  if (!post) notFound('Social post');
  if (post.status !== 'PUBLISHED') {
    badRequest(
      'Only a published post is deleted from its network; delete drafts and scheduled posts as before',
    );
  }
  const posts = post.batchId
    ? await SocialMediaPostModel.find({ batchId: post.batchId, status: 'PUBLISHED' }).lean()
    : [post];
  const results = await Promise.all(posts.map(deleteOne));
  // A refusal changed nothing, so only what was deleted or removed is logged.
  await Promise.all(
    results
      .filter((result) => result.outcome !== 'FAILED')
      .map((result) =>
        recordAudit(ctx, {
          action: 'DELETE',
          module: 'SocialPost',
          entityId: result.postId,
          entityLabel: SOCIAL_NETWORK_LABEL[result.network],
          summary: `Published ${SOCIAL_NETWORK_LABEL[result.network]} post: ${result.message}`,
        }),
      ),
  );
  return results;
}
