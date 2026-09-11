import { useState } from 'react';
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
}: Readonly<Props>) {
  const [busy, setBusy] = useState(false);
  const message =
    entry === null
      ? ''
      : `Your claim for ${formatHoursMinutes(entry.durationMs)} from ${formatDateTime(entry.startedAt, timezone)} will be removed before anybody reviews it. File it again if you change your mind.`;

  async function withdraw(target: ManualEntry): Promise<void> {
    setBusy(true);
    try {
      await tracker.withdrawManualEntry(target.id);
      onWithdrawn();
    } catch (cause: unknown) {
      console.error('Withdrawing the claim failed', cause);
      onFailed(messageOf(cause, WITHDRAW_FAILED));
    } finally {
      setBusy(false);
      onClose();
    }
  }

  return (
    <ConfirmDialog
      open={entry !== null}
      title="Withdraw this claim?"
      message={message}
      confirmLabel="Withdraw"
      danger
      busy={busy}
      onCancel={onClose}
      onConfirm={() => {
        if (entry !== null) {
          withdraw(entry).catch((cause: unknown) => console.error('Withdraw failed', cause));
        }
      }}
    />
  );
}
