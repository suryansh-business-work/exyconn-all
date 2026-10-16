import { useT } from '@exyconn/i18n';
import { Chip, CircularProgress, Tooltip } from '@exyconn/shell/components/ui';
import { LeadEmailStatus } from '@exyconn/shell/graphql/generated';
import type { EmailLookup } from './leadTypes';

const COLOR: Readonly<Record<LeadEmailStatus, 'success' | 'default' | 'warning'>> = {
  [LeadEmailStatus.Found]: 'success',
  [LeadEmailStatus.None]: 'default',
  [LeadEmailStatus.Blocked]: 'warning',
  [LeadEmailStatus.Unreachable]: 'warning',
};

/** Where a row's website lookup stands: running, found addresses, or why there are none. */
export function LeadEmailChip({ lookup }: Readonly<{ lookup: EmailLookup | undefined }>) {
  const t = useT();
  if (!lookup) {
    return null;
  }
  if (lookup.status === 'PENDING') {
    return (
      <Chip
        size="small"
        icon={<CircularProgress size={12} aria-hidden />}
        label={t('Reading website…')}
      />
    );
  }
  if (lookup.status === LeadEmailStatus.Found) {
    return (
      <Chip
        size="small"
        color={COLOR[lookup.status]}
        label={t('{count} emails found', { count: lookup.emails.length })}
      />
    );
  }
  return (
    <Tooltip title={lookup.message}>
      <Chip
        size="small"
        tabIndex={0}
        role="img"
        aria-label={t('No email found: {reason}', { reason: lookup.message })}
        color={COLOR[lookup.status]}
        label={t('No email found')}
      />
    </Tooltip>
  );
}
