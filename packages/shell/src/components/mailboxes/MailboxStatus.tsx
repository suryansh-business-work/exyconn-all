import { useT } from '@exyconn/i18n';
import { Box, Chip, Text } from '@/components/ui';
import { GmailAccountStatus } from '@/graphql/generated';
import { describeMailboxError } from './mailboxError';

/** What the status reads of a mailbox (a company's CRM mailbox or a person's own). */
export interface MailboxStatusRow {
  status: GmailAccountStatus;
  lastError: string;
}

type ChipColor = 'success' | 'warning' | 'error';

/** The chip a mailbox wears: reconnect first, then its last error, else Connected. */
function statusOf(row: MailboxStatusRow): { label: string; color: ChipColor; summary?: string } {
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
export function MailboxStatus({ row }: Readonly<{ row: MailboxStatusRow }>) {
  const t = useT();
  const status = statusOf(row);
  return (
    <Box sx={{ maxWidth: 280, minWidth: 0 }}>
      <Chip size="small" color={status.color} label={t(status.label)} />
      {status.summary && (
        <Text size="sm" color="text.secondary" noWrap title={status.summary} sx={{ mt: 0.5 }}>
          {status.summary}
        </Text>
      )}
    </Box>
  );
}
