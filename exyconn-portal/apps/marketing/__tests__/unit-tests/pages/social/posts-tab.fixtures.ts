import { SocialNetwork, SocialMediaPostStatus } from '@exyconn/shell/graphql/generated';
import { accountRow, postRow, ruleRow } from '../../fixtures';

/** The accounts, rules and posts the PostsTab tests list. */
export const ACCOUNTS = [
  accountRow(),
  accountRow({ id: 'li-1', name: 'Acme', network: SocialNetwork.Linkedin }),
];
export const RULES = [ruleRow(SocialNetwork.Facebook)];

export const POSTS = [
  postRow({ id: 'p-scheduled', text: 'x'.repeat(95) }),
  postRow({
    id: 'p-failed',
    accountId: 'li-1',
    network: SocialNetwork.Linkedin,
    status: SocialMediaPostStatus.Failed,
    text: '',
    error: 'LinkedIn token expired',
    scheduledAt: null,
  }),
  postRow({
    id: 'p-published',
    accountId: 'gone',
    network: SocialNetwork.Instagram,
    status: SocialMediaPostStatus.Published,
    text: 'Launch day',
    publishedAt: '2026-09-12T09:00:00.000Z',
    permalink: 'https://instagram.example/p/1',
  }),
];
