import { useGmailAccountsQuery } from '@exyconn/shell/graphql/generated';
import { GmailAccountCard } from './GmailAccountCard';
import { MailProviderCard, type MailProviderText } from './MailProviderCard';
import { useGmailAccountActions } from './useGmailAccountActions';

const TEXT: MailProviderText = {
  title: 'Gmail',
  description: 'Send from Gmail mailboxes and see every thread with a contact on their page.',
  connectLabel: 'Connect Gmail account',
  empty: 'No Gmail account connected yet.',
  loading: 'Loading the Gmail accounts',
  loadError: 'Could not load the Gmail accounts.',
  unavailable:
    'Google mailbox connections are not switched on yet. Ask your platform administrator to set them up in Tech > Environment Variables > Email accounts (OAuth).',
};

/** The company's Gmail mailboxes the CRM reads threads in and sends from. */
export function GmailCard({ ready }: Readonly<{ ready: boolean }>) {
  const actions = useGmailAccountActions();
  const { data, loading, error, refetch } = useGmailAccountsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const accounts = (data?.gmailAccounts ?? []).map((account) => (
    <GmailAccountCard key={account.id} account={account} actions={actions} />
  ));
  return (
    <MailProviderCard
      provider="GMAIL"
      text={TEXT}
      ready={ready}
      loaded={Boolean(data)}
      loading={loading}
      error={error}
      refetch={refetch}
      available={data?.gmailClientReady}
      connecting={actions.connecting}
      onConnect={actions.connect}
      accounts={accounts}
    />
  );
}
