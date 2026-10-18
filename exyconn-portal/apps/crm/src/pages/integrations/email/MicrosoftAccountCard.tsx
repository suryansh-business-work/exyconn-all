import { useFormatters, useT } from '@exyconn/i18n';
import type { MicrosoftMailAccountFieldsFragment } from '@exyconn/shell/graphql/generated';
import { MailboxCard } from '../../../integrations/MailboxCard';
import type { MicrosoftMailActions } from './useMicrosoftMailActions';

interface MicrosoftAccountCardProps {
  account: MicrosoftMailAccountFieldsFragment;
  actions: MicrosoftMailActions;
}

/** One connected Microsoft mailbox, with when the CRM last sent from it. */
export function MicrosoftAccountCard({ account, actions }: Readonly<MicrosoftAccountCardProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const lastUsed = account.lastUsedAt ? formatDateTime(account.lastUsedAt) : t('Never');
  return (
    <MailboxCard
      account={account}
      actions={actions}
      heading="h3"
      activity={t('Last used: {when}', { when: lastUsed })}
    />
  );
}
