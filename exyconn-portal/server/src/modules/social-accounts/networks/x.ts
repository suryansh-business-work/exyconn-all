import { getJson, postJson } from '../social.http';
import {
  SYNC_LIMIT,
  count,
  list,
  str,
  withLink,
  type NetworkClient,
  type NetworkPost,
} from './network.types';

const API = 'https://api.x.com/2';

/**
 * An X profile. Reading posts needs a paid X API plan (Basic or above) — on the free plan X
 * refuses, and that refusal is what the sync reports. Posting works on every plan, text only.
 */
export const x: NetworkClient = {
  fetchPosts: async (account) => {
    const body = await getJson(
      'X',
      `${API}/users/${account.externalId}/tweets?max_results=${SYNC_LIMIT}&tweet.fields=created_at,public_metrics`,
      account.accessToken,
    );
    return list(body.data).map((tweet): NetworkPost => {
      const metrics = (tweet.public_metrics ?? {}) as Record<string, unknown>;
      const id = str(tweet.id);
      return {
        externalId: id,
        text: str(tweet.text),
        mediaUrl: '',
        permalink: `https://x.com/i/web/status/${id}`,
        publishedAt: new Date(str(tweet.created_at)),
        metrics: {
          likes: count(metrics.like_count),
          comments: count(metrics.reply_count),
          shares: count(metrics.retweet_count) + count(metrics.quote_count),
          views: count(metrics.impression_count),
        },
      };
    });
  },
  publish: async (account, post) => {
    const created = await postJson(
      'X',
      `${API}/tweets`,
      { text: withLink(post) },
      account.accessToken,
    );
    const id = str((created.data as Record<string, unknown> | undefined)?.id);
    return { externalId: id, permalink: `https://x.com/i/web/status/${id}` };
  },
};
