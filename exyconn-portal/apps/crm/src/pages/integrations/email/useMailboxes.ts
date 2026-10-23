import { useMemo } from 'react';
import {
  useGmailAccountsQuery,
  useMicrosoftMailAccountsQuery,
  type GmailAccountFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import type { MailProvider, MailboxRow } from './mailboxes';

/** One provider's list query, as the page needs it. */
export interface MailboxSource {
  /** Whether the platform can connect this provider; unknown until the list loads. */
  available: boolean | undefined;
  /** Set only when the list failed and nothing is on screen from an earlier load. */
  error: Error | undefined;
  refetch: () => Promise<unknown>;
}

type AccountFields = Omit<GmailAccountFieldsFragment, '__typename' | 'lastSyncAt' | 'connectedAt'>;

function toRow(provider: MailProvider, account: AccountFields, at?: string | null): MailboxRow {
  return {
    id: `${provider}:${account.id}`,
    account: { id: account.id, email: account.email },
    provider,
    email: account.email,
    enabled: account.enabled,
    status: account.status,
    lastError: account.lastError,
    lastErrorAt: account.lastErrorAt ?? null,
    connectedByName: account.connectedByName,
    lastActivityAt: at ?? null,
  };
}

/** Every connected Gmail and Microsoft mailbox in one list, with each provider's query state. */
export function useMailboxes() {
  const gmail = useGmailAccountsQuery({ fetchPolicy: 'cache-and-network' });
  const microsoft = useMicrosoftMailAccountsQuery({ fetchPolicy: 'cache-and-network' });
  const gmailAccounts = gmail.data?.gmailAccounts;
  const microsoftAccounts = microsoft.data?.microsoftMailAccounts;
  const rows = useMemo(
    () => [
      ...(gmailAccounts ?? []).map((a) => toRow('GMAIL', a, a.lastSyncAt)),
      ...(microsoftAccounts ?? []).map((a) => toRow('MICROSOFT', a, a.lastUsedAt)),
    ],
    [gmailAccounts, microsoftAccounts],
  );
  const sources: Readonly<Record<MailProvider, MailboxSource>> = {
    GMAIL: {
      available: gmail.data?.gmailClientReady,
      error: gmail.data ? undefined : gmail.error,
      refetch: gmail.refetch,
    },
    MICROSOFT: {
      available: microsoft.data?.microsoftMailClientReady,
      error: microsoft.data ? undefined : microsoft.error,
      refetch: microsoft.refetch,
    },
  };
  const refetch = () => Promise.all([gmail.refetch(), microsoft.refetch()]);
  return { rows, loading: gmail.loading || microsoft.loading, sources, refetch };
}
