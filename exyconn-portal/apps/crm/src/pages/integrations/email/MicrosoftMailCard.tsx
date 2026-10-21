import { useMicrosoftMailAccountsQuery } from '@exyconn/shell/graphql/generated';
import { MailProviderCard, type MailProviderText } from './MailProviderCard';
import { MicrosoftAccountCard } from './MicrosoftAccountCard';
import { useMicrosoftMailActions } from './useMicrosoftMailActions';

const TEXT: MailProviderText = {
  title: 'Microsoft (Outlook / Microsoft 365)',
  description: 'Send CRM emails from Outlook or Microsoft 365 mailboxes.',
  connectLabel: 'Connect Microsoft account',
  empty: 'No Microsoft mailbox connected yet.',
  loading: 'Loading the Microsoft mailboxes',
  loadError: 'Could not load the Microsoft mailboxes.',
  unavailable:
    'Microsoft mailbox connections are not switched on yet. Ask your platform administrator to set them up in Tech > Environment Variables > Email accounts (OAuth).',
};

/** The company's Microsoft (Outlook / Microsoft 365) mailboxes the CRM sends from. */
export function MicrosoftMailCard({ ready }: Readonly<{ ready: boolean }>) {
  const actions = useMicrosoftMailActions();
  const { data, loading, error, refetch } = useMicrosoftMailAccountsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const accounts = (data?.microsoftMailAccounts ?? []).map((account) => (
    <MicrosoftAccountCard key={account.id} account={account} actions={actions} />
  ));
  return (
    <MailProviderCard
      provider="MICROSOFT"
      text={TEXT}
      ready={ready}
      loaded={Boolean(data)}
      loading={loading}
      error={error}
      refetch={refetch}
      available={data?.microsoftMailClientReady}
      connecting={actions.connecting}
      onConnect={actions.connect}
      accounts={accounts}
    />
  );
}
