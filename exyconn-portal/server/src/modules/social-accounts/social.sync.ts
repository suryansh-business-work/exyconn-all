import { NETWORKS } from './networks';
import { SocialAccountModel } from './social.models';
import { SocialMediaPostModel } from './social-post.model';
import { accessTokenOf } from './social.tokens';
import { logger } from '../../utils/logger';
import { inSequence } from '../../utils/inSequence';
import { LIVE_ACCOUNT } from './social.accounts';
import { syncLinkedInPages } from './social.linkedin-pages';

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
  if (account.active === false) {
    return {
      accountId,
      synced: 0,
      error: `${account.name} is paused. Turn it back on to sync it.`,
    };
  }
  if (account.disconnectedAt) {
    return {
      accountId,
      synced: 0,
      error: `${account.name} is no longer reachable — connect it again.`,
    };
  }
  try {
    const accessToken = await accessTokenOf(account);
    // A LinkedIn member's sync also refreshes which company pages it administers.
    if (account.network === 'LINKEDIN' && account.kind !== 'ORGANIZATION') {
      await syncLinkedInPages(account, accessToken);
    }
    const posts = await NETWORKS[account.network].fetchPosts({
      externalId: account.externalId,
      accessToken,
      kind: account.kind ?? 'PERSON',
    });
    const found = posts ?? [];
    // One upsert per post rather than a bulkWrite: bulkWrite goes around the tenant layer, so
    // the posts it inserted carried no organization and were invisible to the company. One
    // after another, so a post the network lists twice cannot race its own unique-index upsert.
    await inSequence(found, (post) =>
      SocialMediaPostModel.updateOne(
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
      ).exec(),
    );
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

/**
 * Every live account of the company in scope, one after another — the scheduled refresh and
 * "Sync all". Paused accounts and pages no longer reachable are left alone.
 */
export async function syncAllAccounts(): Promise<SyncResult[]> {
  const accounts = await SocialAccountModel.find(LIVE_ACCOUNT).select('_id').lean();
  // One account at a time: the networks rate-limit reads per app.
  const results = await inSequence(accounts, (account) => syncAccount(account._id.toHexString()));
  const failed = results.filter((result) => result.error);
  if (failed.length > 0) logger.warn({ failed }, 'Some social accounts could not be synced');
  return results;
}
