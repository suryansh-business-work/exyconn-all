import { SocialNetwork } from '@exyconn/shell/graphql/generated';
import { accountRow, ruleRow } from '../../../../fixtures';

/** A time comfortably in the future, so a scheduled post always validates. */
export const FUTURE = '2099-01-01T10:00:00.000Z';

export const ACCOUNTS = [
  accountRow(),
  accountRow({ id: 'ig-1', name: 'Acme IG', network: SocialNetwork.Instagram }),
  accountRow({ id: 'li-ro', name: 'Acme In', network: SocialNetwork.Linkedin }),
  accountRow({ id: 'yt-1', name: 'Acme TV', network: SocialNetwork.Youtube }),
];

export const RULES = [
  ruleRow(SocialNetwork.Facebook, { note: 'Facebook takes links and images.' }),
  ruleRow(SocialNetwork.Instagram, { maxChars: 2200, requiresImage: true }),
  ruleRow(SocialNetwork.Linkedin, { canPublish: false, note: 'LinkedIn is read only here.' }),
];
