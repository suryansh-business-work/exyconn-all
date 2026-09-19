import { getJson, postForm } from '../social.http';
import {
  SYNC_LIMIT,
  count,
  list,
  str,
  type NetworkAccount,
  type NetworkClient,
  type NetworkPost,
} from './network.types';

const GRAPH = 'https://graph.facebook.com/v19.0';

/** The Graph API reads its token from the query, which also works with page tokens. */
const graph = (path: string, account: NetworkAccount, params: Record<string, string> = {}) =>
  `${GRAPH}/${path}?${new URLSearchParams({ ...params, access_token: account.accessToken }).toString()}`;

const summary = (value: unknown): number =>
  count((value as { summary?: { total_count?: number } } | undefined)?.summary?.total_count);

/** A Facebook Page: its posts with reactions, comments and shares; text, link or photo posts. */
export const facebook: NetworkClient = {
  fetchPosts: async (account) => {
    const body = await getJson(
      'Facebook',
      graph(`${account.externalId}/posts`, account, {
        limit: String(SYNC_LIMIT),
        fields:
          'id,message,created_time,permalink_url,full_picture,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)',
      }),
    );
    return list(body.data).map((post): NetworkPost => ({
      externalId: str(post.id),
      text: str(post.message),
      mediaUrl: str(post.full_picture),
      permalink: str(post.permalink_url),
      publishedAt: new Date(str(post.created_time)),
      metrics: {
        likes: summary(post.reactions),
        comments: summary(post.comments),
        shares: count((post.shares as { count?: number } | undefined)?.count),
        views: 0,
      },
    }));
  },
  publish: async (account, post) => {
    const params = { access_token: account.accessToken };
    const created = post.mediaUrl
      ? await postForm('Facebook', `${GRAPH}/${account.externalId}/photos`, {
          ...params,
          url: post.mediaUrl,
          caption: post.link ? `${post.text}\n\n${post.link}` : post.text,
        })
      : await postForm('Facebook', `${GRAPH}/${account.externalId}/feed`, {
          ...params,
          message: post.text,
          ...(post.link ? { link: post.link } : {}),
        });
    const id = str(created.post_id) || str(created.id);
    return { externalId: id, permalink: `https://www.facebook.com/${id}` };
  },
};

/** An Instagram Business account: its media with likes and comments; image posts only. */
export const instagram: NetworkClient = {
  fetchPosts: async (account) => {
    const body = await getJson(
      'Instagram',
      graph(`${account.externalId}/media`, account, {
        limit: String(SYNC_LIMIT),
        fields: 'id,caption,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
      }),
    );
    return list(body.data).map((media): NetworkPost => ({
      externalId: str(media.id),
      text: str(media.caption),
      mediaUrl: str(media.thumbnail_url) || str(media.media_url),
      permalink: str(media.permalink),
      publishedAt: new Date(str(media.timestamp)),
      metrics: {
        likes: count(media.like_count),
        comments: count(media.comments_count),
        shares: 0,
        views: 0,
      },
    }));
  },
  publish: async (account, post) => {
    const params = { access_token: account.accessToken };
    // Instagram publishes in two steps: a media container, then the container itself.
    const container = await postForm('Instagram', `${GRAPH}/${account.externalId}/media`, {
      ...params,
      image_url: post.mediaUrl,
      caption: post.link ? `${post.text}\n\n${post.link}` : post.text,
    });
    const published = await postForm('Instagram', `${GRAPH}/${account.externalId}/media_publish`, {
      ...params,
      creation_id: str(container.id),
    });
    const id = str(published.id);
    const details = await getJson('Instagram', graph(id, account, { fields: 'permalink' }));
    return { externalId: id, permalink: str(details.permalink) };
  },
};
