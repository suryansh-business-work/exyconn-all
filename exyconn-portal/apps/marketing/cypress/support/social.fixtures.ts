/** GraphQL payloads the social specs mock with — complete records, as the API returns them. */
export const RULES = [
  {
    network: 'FACEBOOK',
    canPublish: true,
    maxChars: 63206,
    requiresImage: false,
    allowsImage: true,
    note: 'Text, a link or a photo.',
  },
  {
    network: 'INSTAGRAM',
    canPublish: true,
    maxChars: 2200,
    requiresImage: true,
    allowsImage: true,
    note: 'Needs an image.',
  },
  {
    network: 'LINKEDIN',
    canPublish: true,
    maxChars: 3000,
    requiresImage: false,
    allowsImage: false,
    note: 'Text.',
  },
  {
    network: 'X',
    canPublish: true,
    maxChars: 280,
    requiresImage: false,
    allowsImage: false,
    note: 'Text up to 280.',
  },
  {
    network: 'YOUTUBE',
    canPublish: false,
    maxChars: 0,
    requiresImage: false,
    allowsImage: false,
    note: 'Analytics only.',
  },
].map((rule) => ({ __typename: 'SocialNetworkRule', ...rule }));

export const account = (id: string, network: string, name: string) => ({
  __typename: 'SocialAccount',
  id,
  network,
  app: network === 'FACEBOOK' || network === 'INSTAGRAM' ? 'META' : network,
  name,
  handle: '',
  avatarUrl: '',
  expiresAt: null,
  lastSyncedAt: null,
  syncError: '',
  createdAt: '2026-09-19T00:00:00.000Z',
});

export const ACCOUNTS = [
  account('fb', 'FACEBOOK', 'Exyconn'),
  account('x1', 'X', 'Exyconn X'),
  account('yt', 'YOUTUBE', 'Exyconn TV'),
];

export const post = (id: string, over: Record<string, unknown> = {}) => ({
  __typename: 'SocialMediaPost',
  id,
  accountId: 'fb',
  network: 'FACEBOOK',
  origin: 'SYNCED',
  status: 'PUBLISHED',
  text: `Post ${id}`,
  mediaUrl: '',
  link: '',
  permalink: `https://facebook.com/${id}`,
  scheduledAt: null,
  publishedAt: '2026-09-18T10:00:00.000Z',
  error: '',
  engagement: 12,
  batchId: '',
  createdAt: '2026-09-18T10:00:00.000Z',
  metrics: { __typename: 'SocialMediaPostMetrics', likes: 9, comments: 2, shares: 1, views: 40 },
  ...over,
});
