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

/** Why the address got its status, when it was checked and — when known — by whom. */
function checkDetail(
  t: ReturnType<typeof useT>,
  verification: EmailVerificationBadgeFragment,
  label: string,
  when: string,
): string {
  const reason = verification.reason || label;
  if (verification.checkedBy) {
    return t('{reason} · checked {when} by {who}', { reason, when, who: verification.checkedBy });
  }
  return t('{reason} · checked {when}', { reason, when });
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
    ? checkDetail(t, verification, t(view.label), formatDateTime(verification.checkedAt))
    : t('Never checked. Click to check it now.');
  const clickable = Boolean(!verification && onCheck && !checking);
  // A chip that only shows a result is an image of it, focusable so its tooltip (the reason and
  // when) is reachable by keyboard and its name is read out (SC 2.1.1, 4.1.2).
  const statusOnly = clickable ? {} : { role: 'img', tabIndex: 0 };
  return (
    <Tooltip title={detail}>
      <Chip
        {...statusOnly}
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
