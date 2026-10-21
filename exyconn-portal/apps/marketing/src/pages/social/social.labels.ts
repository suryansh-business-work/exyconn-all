import type { SocialAccountKind, SocialNetwork } from '@exyconn/shell/graphql/generated';

/** The networks as people know them. */
export const NETWORK_LABEL: Readonly<Record<SocialNetwork, string>> = {
  LINKEDIN: 'LinkedIn',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  THREADS: 'Threads',
  X: 'X',
  YOUTUBE: 'YouTube',
};

/** Where the Social section lives; each tab is a slug beneath it. */
export const SOCIAL_PATH = '/marketing/social';

interface LabelledAccount {
  name: string;
  network: SocialNetwork;
  kind?: SocialAccountKind;
}

/** An account as a picker option: its name and the network it is on ("Exyconn · LinkedIn page"). */
export const accountLabel = (account: LabelledAccount): string => {
  const network = NETWORK_LABEL[account.network];
  const where = account.kind === 'ORGANIZATION' ? `${network} page` : network;
  return `${account.name} · ${where}`;
};

/** Whether posts can go to the account now: not paused, and still reachable. */
export const isPostable = (account: {
  active?: boolean;
  disconnectedAt?: string | null;
}): boolean => account.active !== false && !account.disconnectedAt;

/** The states a post can still be edited, published or deleted in — it has not gone out. */
export const UNSENT = new Set<string>(['DRAFT', 'SCHEDULED', 'FAILED']);
