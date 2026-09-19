import { postJson } from '../social.http';
import { str, type NetworkClient } from './network.types';

/**
 * A LinkedIn member. LinkedIn only lets partner-approved apps read a member's posts, so a sync
 * reads nothing (null): the posts made from Exyconn are the ones tracked here. Text posts,
 * with a link shared as an article.
 */
export const linkedin: NetworkClient = {
  fetchPosts: async () => null,
  publish: async (account, post) => {
    const created = await postJson(
      'LinkedIn',
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: `urn:li:person:${account.externalId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: post.text },
            shareMediaCategory: post.link ? 'ARTICLE' : 'NONE',
            ...(post.link ? { media: [{ status: 'READY', originalUrl: post.link }] } : {}),
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      },
      account.accessToken,
      { 'X-Restli-Protocol-Version': '2.0.0' },
    );
    const id = str(created.id);
    return { externalId: id, permalink: `https://www.linkedin.com/feed/update/${id}` };
  },
};
