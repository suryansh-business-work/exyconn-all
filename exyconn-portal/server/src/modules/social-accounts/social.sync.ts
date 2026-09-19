import { NETWORKS } from './networks';
import { SocialAccountModel } from './social.models';
import { SocialMediaPostModel } from './social-post.model';
import { accessTokenOf } from './social.tokens';
import { logger } from '../../utils/logger';

export interface SyncResult {
  accountId: string;
  synced: number;
  error: string;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Reads one account's recent posts and their numbers from the network and files them. A post
 * published from here is matched by its network id, so its numbers land on the composed post
 * rather than a copy. A network that refuses (a free X plan, an expired connection) is
 * recorded on the account, where the Marketing page shows it.
 */
export async function syncAccount(accountId: string): Promise<SyncResult> {
  const account = await SocialAccountModel.findById(accountId).lean();
  if (!account) return { accountId, synced: 0, error: 'The account is no longer connected.' };
  try {
    const posts = await NETWORKS[account.network].fetchPosts({
      externalId: account.externalId,
      accessToken: await accessTokenOf(account),
    });
    const found = posts ?? [];
    // One upsert per post rather than a bulkWrite: bulkWrite goes around the tenant layer, so
    // the posts it inserted carried no organization and were invisible to the company.
    for (const post of found) {
      await SocialMediaPostModel.updateOne(
        { accountId, externalId: post.externalId },
        {
          $set: {
            network: account.network,
            app: account.app,
            permalink: post.permalink,
            publishedAt: post.publishedAt,
            metrics: post.metrics,
          },
          $setOnInsert: {
            origin: 'SYNCED',
            status: 'PUBLISHED',
            text: post.text,
            mediaUrl: post.mediaUrl,
          },
        },
        { upsert: true },
      );
    }
    await SocialAccountModel.updateOne(
      { _id: accountId },
      { $set: { lastSyncedAt: new Date(), syncError: '' } },
    );
    return { accountId, synced: found.length, error: '' };
  } catch (error) {
    const reason = messageOf(error);
    await SocialAccountModel.updateOne(
      { _id: accountId },
      { $set: { lastSyncedAt: new Date(), syncError: reason } },
    );
    return { accountId, synced: 0, error: reason };
  }
}

/** Every account of the company in scope, one after another — the scheduled refresh. */
export async function syncAllAccounts(): Promise<SyncResult[]> {
  const accounts = await SocialAccountModel.find().select('_id').lean();
  const results: SyncResult[] = [];
  for (const account of accounts) {
    results.push(await syncAccount(String(account._id)));
  }
  const failed = results.filter((result) => result.error);
  if (failed.length > 0) logger.warn({ failed }, 'Some social accounts could not be synced');
  return results;
}
