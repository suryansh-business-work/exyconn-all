/** The OAuth apps the install registers — one per provider, set up in the Tech portal. */
export const SOCIAL_APPS = ['LINKEDIN', 'META', 'X', 'YOUTUBE'] as const;
export type SocialApp = (typeof SOCIAL_APPS)[number];

/** The accounts a connection yields: one Meta app connects Facebook Pages and Instagram. */
export const SOCIAL_NETWORKS = ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'X', 'YOUTUBE'] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

/** Where a provider sends the browser after consent. */
export const SOCIAL_CALLBACK_PATH = '/oauth/social';

/** How long a started connection may take before its state is refused. */
export const OAUTH_STATE_TTL_SECONDS = 600;
