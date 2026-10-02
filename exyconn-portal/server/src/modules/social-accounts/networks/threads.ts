import { THREADS_GRAPH } from '../social.constants';
import { SocialProviderError, getJson, postForm } from '../social.http';
import {
  SYNC_LIMIT,
  count,
  list,
  str,
  withLink,
  type NetworkAccount,
  type NetworkClient,
  type NetworkPost,
} from './network.types';

const API = `${THREADS_GRAPH}/v1.0`;

/** The Threads API reads its token from the query, as the Facebook Graph API does. */
const endpoint = (path: string, account: NetworkAccount, params: Record<string, string>) =>
  `${API}/${path}?${new URLSearchParams({ ...params, access_token: account.accessToken }).toString()}`;

/** How long an image container may take to be ready: checked every second, about 30 seconds. */
export const CONTAINER_WAIT = { attempts: 30, intervalMs: 1000 };
/** The container states that will never become ready. */
const FAILED_CONTAINER = new Set(['ERROR', 'EXPIRED']);

const pause = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

/** Waits until Threads has fetched and processed an image container, or says why it did not. */
async function awaitContainer(account: NetworkAccount, id: string): Promise<void> {
  for (let attempt = 0; attempt < CONTAINER_WAIT.attempts; attempt += 1) {
    const body = await getJson(
      'Threads',
      endpoint(id, account, { fields: 'status,error_message' }),
    );
    const status = str(body.status);
    if (status === 'FINISHED') return;
    if (FAILED_CONTAINER.has(status)) {
      throw new SocialProviderError(
        'Threads',
        str(body.error_message) || `the image container is ${status.toLowerCase()}`,
      );
    }
    await pause(CONTAINER_WAIT.intervalMs);
  }
  throw new SocialProviderError('Threads', 'the image was not ready in time; try again');
}

/** One post's numbers. Threads answers each metric as `{ name, values: [{ value }] }`. */
async function insightsOf(account: NetworkAccount, id: string): Promise<NetworkPost['metrics']> {
  const body = await getJson(
    'Threads',
    endpoint(`${id}/insights`, account, { metric: 'likes,replies,reposts,views' }),
  );
  const metrics = list(body.data);
  const value = (name: string) =>
    count(list(metrics.find((metric) => metric.name === name)?.values)[0]?.value);
  return {
    likes: value('likes'),
    comments: value('replies'),
    shares: value('reposts'),
    views: value('views'),
  };
}

/** A Threads profile: its posts with their insights; text posts, with an optional image. */
export const threads: NetworkClient = {
  fetchPosts: async (account) => {
    const body = await getJson(
      'Threads',
      endpoint(`${account.externalId}/threads`, account, {
        fields: 'id,text,media_url,permalink,timestamp',
        limit: String(SYNC_LIMIT),
      }),
    );
    return Promise.all(
      list(body.data).map(async (post): Promise<NetworkPost> => ({
        externalId: str(post.id),
        text: str(post.text),
        mediaUrl: str(post.media_url),
        permalink: str(post.permalink),
        publishedAt: new Date(str(post.timestamp)),
        metrics: await insightsOf(account, str(post.id)),
      })),
    );
  },
  publish: async (account, post) => {
    const params = { access_token: account.accessToken };
    const media: Record<string, string> = post.mediaUrl
      ? { media_type: 'IMAGE', image_url: post.mediaUrl }
      : { media_type: 'TEXT' };
    // Threads publishes in two steps, like Instagram: a media container, then the container.
    const container = await postForm('Threads', `${API}/${account.externalId}/threads`, {
      ...params,
      ...media,
      text: withLink(post),
    });
    // An image is fetched and processed first; publishing before that is refused.
    if (post.mediaUrl) await awaitContainer(account, str(container.id));
    const published = await postForm('Threads', `${API}/${account.externalId}/threads_publish`, {
      ...params,
      creation_id: str(container.id),
    });
    const id = str(published.id);
    const details = await getJson('Threads', endpoint(id, account, { fields: 'permalink' }));
    return { externalId: id, permalink: str(details.permalink) };
  },
};
