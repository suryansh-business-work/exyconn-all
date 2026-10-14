import { useT, useFormatters } from '@exyconn/i18n';
import { Chip, Tooltip } from '@exyconn/shell/components/ui';
import type { EmailVerificationBadgeFragment } from '@exyconn/shell/graphql/generated';
import { EMAIL_STATUS_VIEW } from './emailStatus';

interface EmailStatusBadgeProps {
  verification: EmailVerificationBadgeFragment | null | undefined;
  /** Checks the address now; offered on an address that was never checked. */
  onCheck?: () => void;
  checking?: boolean;
}

/** The latest check of an address as a chip: a green tick for a verified mailbox. */
export function EmailStatusBadge({
  verification,
  onCheck,
  checking = false,
}: Readonly<EmailStatusBadgeProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const view = EMAIL_STATUS_VIEW[verification?.status ?? 'NOT_CHECKED'];
  const Icon = view.Icon;
  const label = checking ? t('Checking…') : t(view.label);
  const detail = verification
    ? t('{reason} · checked {when}', {
        reason: verification.reason || t(view.label),
        when: formatDateTime(verification.checkedAt),
      })
    : t('Never checked. Click to check it now.');
  const clickable = !verification && onCheck && !checking;
  return (
    <Tooltip title={detail}>
      <Chip
        size="small"
        variant={verification ? 'filled' : 'outlined'}
        color={view.color}
        icon={<Icon fontSize="small" />}
        label={label}
        onClick={clickable ? onCheck : undefined}
        aria-label={`${label}: ${detail}`}
      />
    </Tooltip>
  );
}
