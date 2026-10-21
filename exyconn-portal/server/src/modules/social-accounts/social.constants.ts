/** The OAuth apps the install registers — one per provider, set up in the Tech portal. */
export const SOCIAL_APPS = ['LINKEDIN', 'META', 'THREADS', 'X', 'YOUTUBE'] as const;
export type SocialApp = (typeof SOCIAL_APPS)[number];

/** The accounts a connection yields: one Meta app connects Facebook Pages and Instagram. */
export const SOCIAL_NETWORKS = [
  'LINKEDIN',
  'FACEBOOK',
  'INSTAGRAM',
  'THREADS',
  'X',
  'YOUTUBE',
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

/** Each network by the name people know it by, for the messages the server words. */
export const SOCIAL_NETWORK_LABEL: Readonly<Record<SocialNetwork, string>> = {
  LINKEDIN: 'LinkedIn',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  THREADS: 'Threads',
  X: 'X',
  YOUTUBE: 'YouTube',
};

/** Where a provider sends the browser after consent. */
export const SOCIAL_CALLBACK_PATH = '/oauth/social';

/** How long a started connection may take before its state is refused. */
export const OAUTH_STATE_TTL_SECONDS = 600;

/** The Threads Graph API: its own host and app, separate from Facebook's. */
export const THREADS_GRAPH = 'https://graph.threads.net';

/** LinkedIn's versioned REST API (Posts, Community Management): one version for every call. */
export const LINKEDIN_REST = 'https://api.linkedin.com/rest';
export const LINKEDIN_HEADERS: Readonly<Record<string, string>> = {
  'LinkedIn-Version': '202509',
  'X-Restli-Protocol-Version': '2.0.0',
};

/** What a member connection asks for: sign-in, and posting as the member. */
export const LINKEDIN_MEMBER_SCOPES = ['openid', 'profile', 'w_member_social'] as const;
/**
 * Company pages (LinkedIn's Community Management API product): list the pages the member
 * administers, post as them, and read the pages' posts with their numbers.
 */
export const LINKEDIN_PAGE_SCOPES = [
  'r_organization_admin',
  'w_organization_social',
  'r_organization_social',
] as const;

/** Whose account it is: a person's own, or an organization's page acting as itself. */
export const SOCIAL_ACCOUNT_KINDS = ['PERSON', 'ORGANIZATION'] as const;
export type SocialAccountKind = (typeof SOCIAL_ACCOUNT_KINDS)[number];
