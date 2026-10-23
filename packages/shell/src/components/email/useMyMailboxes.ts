import { GmailAccountStatus, useMyMailboxesQuery } from '@/graphql/generated';

/**
 * The signed-in person's own mailboxes (the default one first), the ones that can send right
 * now, and which providers they can connect through.
 */
export function useMyMailboxes() {
  const { data, loading, error, refetch } = useMyMailboxesQuery({
    fetchPolicy: 'cache-and-network',
  });
  const mailboxes = data?.myMailboxes ?? [];
  return {
    mailboxes,
    usable: mailboxes.filter((mailbox) => mailbox.status === GmailAccountStatus.Connected),
    providers: data?.myMailboxProviders ?? { gmail: false, microsoft: false },
    loading: loading && !data,
    error,
    refetch,
  };
}
