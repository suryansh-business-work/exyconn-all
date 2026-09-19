/** An account as a network client needs it: which one, and how to act as it. */
export interface NetworkAccount {
  /** The network's id for the member, page, profile or channel. */
  externalId: string;
  accessToken: string;
}

/** A post as read from the network, with the numbers it shares. */
export interface NetworkPost {
  externalId: string;
  text: string;
  mediaUrl: string;
  permalink: string;
  publishedAt: Date;
  metrics: { likes: number; comments: number; shares: number; views: number };
}

/** What the composer hands a network. */
export interface OutgoingPost {
  text: string;
  mediaUrl: string;
  link: string;
}

export interface PublishedPost {
  externalId: string;
  permalink: string;
}

/**
 * One network: how to read an account's recent posts, and — where the network allows it —
 * how to publish. `fetchPosts` returns null where the network does not let an app read them.
 */
export interface NetworkClient {
  fetchPosts: (account: NetworkAccount) => Promise<NetworkPost[] | null>;
  publish: ((account: NetworkAccount, post: OutgoingPost) => Promise<PublishedPost>) | null;
}

/** How many recent posts a sync reads. */
export const SYNC_LIMIT = 50;

export const count = (value: unknown): number =>
  typeof value === 'number' ? value : Number(value) || 0;
export const str = (value: unknown): string => (typeof value === 'string' ? value : '');
export const list = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

/** A post's text plus its link, for networks with one text field. */
export const withLink = (post: OutgoingPost): string =>
  post.link && !post.text.includes(post.link) ? `${post.text}\n\n${post.link}`.trim() : post.text;
