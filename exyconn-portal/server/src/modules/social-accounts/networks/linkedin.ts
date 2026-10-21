import { LINKEDIN_HEADERS, LINKEDIN_REST } from '../social.constants';
import { getJson, sendJson } from '../social.http';
import { logger } from '../../../utils/logger';
import {
  SYNC_LIMIT,
  count,
  list,
  str,
  type NetworkAccount,
  type NetworkClient,
  type NetworkPost,
} from './network.types';

/** Who a post is by: the member, or the company page acting as itself. */
export const authorOf = (account: NetworkAccount): string =>
  account.kind === 'ORGANIZATION'
    ? `urn:li:organization:${account.externalId}`
    : `urn:li:person:${account.externalId}`;

/**
 * LinkedIn reads post text as "little text": these characters are markup unless escaped, and
 * an unescaped one cuts the post short or gets it refused.
 */
const LITTLE_TEXT_RESERVED = /[\\|{}@[\]()<>#*_~]/g;
export const littleText = (text: string): string =>
  text.replaceAll(LITTLE_TEXT_RESERVED, String.raw`\$&`);

/** An article needs a title; the site's own name is the plainest one there is. */
const articleTitle = (link: string): string => {
  try {
    return new URL(link).hostname;
  } catch {
    return link;
  }
};

const permalinkOf = (urn: string) => `https://www.linkedin.com/feed/update/${urn}`;
const ZERO = { likes: 0, comments: 0, shares: 0, views: 0 };

type Metrics = NetworkPost['metrics'];

/** A Rest.li list of URNs, each encoded and the list itself left as Rest.li reads it. */
const restliList = (urns: string[]) => `List(${urns.map(encodeURIComponent).join(',')})`;

/**
 * The numbers of a page's posts, by post URN. LinkedIn counts shares and ugcPosts apart, so
 * each kind is asked for under its own name. A refusal leaves the numbers empty (zero) rather
 * than failing the sync — the posts themselves are still worth having.
 */
async function pageStats(account: NetworkAccount, urns: string[]): Promise<Map<string, Metrics>> {
  const shares = urns.filter((urn) => urn.startsWith('urn:li:share:'));
  const ugcPosts = urns.filter((urn) => urn.startsWith('urn:li:ugcPost:'));
  const stats = new Map<string, Metrics>();
  if (shares.length === 0 && ugcPosts.length === 0) return stats;
  const query = [
    'q=organizationalEntity',
    `organizationalEntity=${encodeURIComponent(authorOf(account))}`,
    ...(shares.length ? [`shares=${restliList(shares)}`] : []),
    ...(ugcPosts.length ? [`ugcPosts=${restliList(ugcPosts)}`] : []),
  ].join('&');
  try {
    const body = await getJson(
      'LinkedIn',
      `${LINKEDIN_REST}/organizationalEntityShareStatistics?${query}`,
      account.accessToken,
      LINKEDIN_HEADERS,
    );
    for (const row of list(body.elements)) {
      const total = (row.totalShareStatistics ?? {}) as Record<string, unknown>;
      stats.set(str(row.share) || str(row.ugcPost), {
        likes: count(total.likeCount),
        comments: count(total.commentCount),
        shares: count(total.shareCount),
        views: count(total.impressionCount),
      });
    }
  } catch (error) {
    logger.warn({ err: error }, 'LinkedIn page post statistics could not be read');
  }
  return stats;
}

/** A company page's latest posts, with what LinkedIn shares of their numbers. */
async function pagePosts(account: NetworkAccount): Promise<NetworkPost[]> {
  const body = await getJson(
    'LinkedIn',
    `${LINKEDIN_REST}/posts?q=author&author=${encodeURIComponent(authorOf(account))}&count=${SYNC_LIMIT}`,
    account.accessToken,
    LINKEDIN_HEADERS,
  );
  const posts = list(body.elements);
  const stats = await pageStats(
    account,
    posts.map((post) => str(post.id)),
  );
  return posts.map((post): NetworkPost => {
    const id = str(post.id);
    return {
      externalId: id,
      text: str(post.commentary),
      mediaUrl: '',
      permalink: permalinkOf(id),
      publishedAt: new Date(count(post.publishedAt) || count(post.createdAt)),
      metrics: stats.get(id) ?? ZERO,
    };
  });
}

/**
 * A LinkedIn member or company page, through the versioned Posts API. LinkedIn lets only
 * partner-approved apps read a member's posts, so a member sync reads nothing (null); a page's
 * posts and numbers are read with the Community Management scopes. Text posts, with a link
 * shared as an article.
 */
export const linkedin: NetworkClient = {
  fetchPosts: (account) =>
    account.kind === 'ORGANIZATION' ? pagePosts(account) : Promise.resolve(null),
  publish: async (account, post) => {
    const { headers } = await sendJson('LinkedIn', `${LINKEDIN_REST}/posts`, {
      method: 'POST',
      accessToken: account.accessToken,
      headers: LINKEDIN_HEADERS,
      body: {
        author: authorOf(account),
        commentary: littleText(post.text),
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
        ...(post.link
          ? { content: { article: { source: post.link, title: articleTitle(post.link) } } }
          : {}),
      },
    });
    // The new post's URN comes back in a header; the body is empty.
    const id = headers.get('x-restli-id') ?? '';
    return { externalId: id, permalink: permalinkOf(id) };
  },
  remove: async (account, externalId) => {
    await sendJson('LinkedIn', `${LINKEDIN_REST}/posts/${encodeURIComponent(externalId)}`, {
      method: 'DELETE',
      accessToken: account.accessToken,
      headers: { ...LINKEDIN_HEADERS, 'X-RestLi-Method': 'DELETE' },
    });
  },
};
