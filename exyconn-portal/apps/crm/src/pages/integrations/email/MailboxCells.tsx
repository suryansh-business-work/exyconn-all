import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Flex, Switch, Text } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { MailboxStatus, PROVIDER_NAMES, ProviderLogo } from '@exyconn/shell/components/mailboxes';
import type { MailboxActions, MailboxRow } from './mailboxes';

const logFailure = (error: unknown) => portalLogger.warn('crm: mailbox action failed', error);

interface MailboxCellProps {
  row: MailboxRow;
}

interface MailboxActionCellProps extends MailboxCellProps {
  actions: MailboxActions;
}

/** The provider's logo, the address and, under it, the provider's name. */
export function MailboxCell({ row }: Readonly<MailboxCellProps>) {
  return (
    <Flex direction="row" spacing={1.5} alignItems="center">
      <ProviderLogo provider={row.provider} size={28} />
      <Box sx={{ minWidth: 0 }}>
        <Text weight="semibold" sx={{ overflowWrap: 'anywhere' }}>
          {row.email}
        </Text>
        <Text size="sm" color="text.secondary">
          {PROVIDER_NAMES[row.provider]}
        </Text>
      </Box>
    </Flex>
  );
}

/** The mailbox's state, with the provider's reason on one line under it (in full in its details). */
export function MailboxStatusCell({ row }: Readonly<MailboxCellProps>) {
  return <MailboxStatus row={row} />;
}

/** Whether the CRM emails from this mailbox; named after the address for screen readers. */
export function UseForCrmSwitch({ row, actions }: Readonly<MailboxActionCellProps>) {
  const t = useT();
  return (
    <Switch
      checked={row.enabled}
      onChange={(event) => {
        actions.toggle(row.account, event.target.checked).catch(logFailure);
      }}
      slotProps={{ input: { 'aria-label': t('Use {email} for CRM', { email: row.email }) } }}
    />
  );
}

/** When Gmail last synced the mailbox, or the CRM last sent from a Microsoft one. */
export function LastActivityCell({ row }: Readonly<MailboxCellProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  return <>{row.lastActivityAt ? formatDateTime(row.lastActivityAt) : t('Never')}</>;
}
