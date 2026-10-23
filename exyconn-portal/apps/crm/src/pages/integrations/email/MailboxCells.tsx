import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Chip, Flex, Switch, Text } from '@exyconn/shell/components/ui';
import { GmailAccountStatus } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ProviderLogo } from '../../../integrations/ProviderLogo';
import { PROVIDER_NAMES } from '../../../integrations/providerNames';
import type { MailboxActions, MailboxRow } from './mailboxes';
import { describeMailboxError } from './mailboxError';

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

type ChipColor = 'success' | 'warning' | 'error';

/** The chip a mailbox wears: reconnect first, then its last error, else Connected. */
function statusOf(row: MailboxRow): { label: string; color: ChipColor; summary?: string } {
  const error = row.lastError ? describeMailboxError(row.lastError) : undefined;
  if (row.status === GmailAccountStatus.NeedsReconnect) {
    return { label: 'Needs reconnecting', color: 'warning', summary: error?.summary };
  }
  if (error) {
    return { label: error.label, color: 'error', summary: error.summary };
  }
  return { label: 'Connected', color: 'success' };
}

/** The mailbox's state, with the provider's reason on one line under it (in full in its details). */
export function MailboxStatusCell({ row }: Readonly<MailboxCellProps>) {
  const t = useT();
  const status = statusOf(row);
  return (
    <Box sx={{ maxWidth: 280 }}>
      <Chip size="small" color={status.color} label={t(status.label)} />
      {status.summary && (
        <Text size="sm" color="text.secondary" noWrap title={status.summary} sx={{ mt: 0.5 }}>
          {status.summary}
        </Text>
      )}
    </Box>
  );
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
