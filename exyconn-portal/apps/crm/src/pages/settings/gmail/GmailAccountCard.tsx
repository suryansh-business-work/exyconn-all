import { useFormatters, useT } from '@exyconn/i18n';
import type { GmailAccountFieldsFragment } from '@exyconn/shell/graphql/generated';
import { MailboxCard } from '../../../integrations/MailboxCard';
import type { GmailAccountActions } from './useGmailAccountActions';

interface GmailAccountCardProps {
  account: GmailAccountFieldsFragment;
  actions: GmailAccountActions;
}

/** One connected Gmail mailbox, with when it last synced. */
export function GmailAccountCard({ account, actions }: Readonly<GmailAccountCardProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const lastSync = account.lastSyncAt ? formatDateTime(account.lastSyncAt) : t('Never');
  return (
    <MailboxCard
      account={account}
      actions={actions}
      activity={t('Last synced: {when}', { when: lastSync })}
    />
  );
}
