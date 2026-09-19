import type { SocialNetwork } from '@exyconn/shell/graphql/generated';

/** The networks as people know them. */
export const NETWORK_LABEL: Readonly<Record<SocialNetwork, string>> = {
  LINKEDIN: 'LinkedIn',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  X: 'X',
  YOUTUBE: 'YouTube',
};

/** Where the Social section lives; each tab is a slug beneath it. */
export const SOCIAL_PATH = '/marketing/social';

/** An account as a picker option: its name and the network it is on. */
export const accountLabel = (account: { name: string; network: SocialNetwork }): string =>
  `${account.name} · ${NETWORK_LABEL[account.network]}`;
