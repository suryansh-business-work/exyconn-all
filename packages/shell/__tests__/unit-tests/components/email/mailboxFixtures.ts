import { vi } from 'vitest';
import {
  CrmEmailProvider,
  GmailAccountStatus,
  type MyMailboxFieldsFragment,
} from '@/graphql/generated';

/** One of the person's own mailboxes, connected and their default. */
export function myMailbox(patch: Partial<MyMailboxFieldsFragment> = {}): MyMailboxFieldsFragment {
  return {
    __typename: 'MyMailbox',
    id: 'm1',
    provider: CrmEmailProvider.Gmail,
    email: 'me@acme.io',
    status: GmailAccountStatus.Connected,
    lastError: '',
    lastErrorAt: null,
    connectedAt: '2026-10-01T09:00:00Z',
    isDefault: true,
    ...patch,
  };
}

/** What useMyMailboxesQuery hands back for these mailboxes. */
export function mailboxesResult(
  mailboxes: MyMailboxFieldsFragment[],
  extras: { loading?: boolean; error?: Error } = {},
) {
  return {
    data: {
      myMailboxes: mailboxes,
      myMailboxProviders: { gmail: true, microsoft: true },
    },
    loading: false,
    error: undefined,
    refetch: vi.fn().mockResolvedValue({}),
    ...extras,
  };
}
