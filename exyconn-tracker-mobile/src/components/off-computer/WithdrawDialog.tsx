import { useState, type RefObject } from 'react';
import type { HostInstance } from 'react-native';
import { useT } from '@exyconn/i18n';
import { formatDateTime, formatHoursMinutes, type ManualEntry } from '@exyconn/tracker-core';
import { tracker } from '../../tracker/instance';
import { messageOf } from '../../tracker/run';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const WITHDRAW_FAILED = 'The claim could not be withdrawn.';

interface Props {
  /** The claim being taken back; null when the dialog is closed. */
  entry: ManualEntry | null;
  timezone: string;
  onClose: () => void;
  /** Runs once the portal has removed it. */
  onWithdrawn: () => void;
  onFailed: (message: string) => void;
  /** The row's Withdraw button; the screen reader goes back to it when the dialog closes. */
  returnFocusTo: RefObject<HostInstance | null>;
}

/**
 * Asks before taking a claim back. Withdrawing deletes it — there is no un-withdraw — so the
 * question names the claim it is about rather than trusting the tap that led here.
 */
export function WithdrawDialog({
  entry,
  timezone,
  onClose,
  onWithdrawn,
  onFailed,
  returnFocusTo,
}: Readonly<Props>) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const message =
    entry === null
      ? ''
      : t(
          'Your claim for {duration} from {start} will be removed before anybody reviews it. File it again if you change your mind.',
          {
            duration: formatHoursMinutes(entry.durationMs),
            start: formatDateTime(entry.startedAt, timezone),
          },
        );

  async function withdraw(target: ManualEntry): Promise<void> {
    setBusy(true);
    try {
      await tracker.withdrawManualEntry(target.id);
      onWithdrawn();
    } catch (cause: unknown) {
      console.error('Withdrawing the claim failed', cause);
      onFailed(messageOf(cause, t(WITHDRAW_FAILED)));
    } finally {
      setBusy(false);
      onClose();
    }
  }

  return (
    <ConfirmDialog
      open={entry !== null}
      title={t('Withdraw this claim?')}
      message={message}
      confirmLabel={t('Withdraw')}
      danger
      busy={busy}
      onCancel={onClose}
      returnFocusTo={returnFocusTo}
      onConfirm={() => {
        if (entry !== null) {
          withdraw(entry).catch((cause: unknown) => console.error('Withdraw failed', cause));
        }
      }}
    />
  );
}
