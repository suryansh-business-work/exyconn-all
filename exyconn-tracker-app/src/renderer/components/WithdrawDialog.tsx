import type { ReactElement } from 'react';
import { useId } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { ManualEntry } from '@shared/types';
import { formatDateTime, formatHoursMinutes } from '@exyconn/tracker-core';

interface Props {
  /** The claim being taken back; null when the dialog is closed. */
  entry: ManualEntry | null;
  timezone: string;
  /** The withdrawal is on its way: a spinner on Withdraw, and no way out until it lands. */
  busy: boolean;
  onCancel: () => void;
  onConfirm: (entry: ManualEntry) => void;
}

/**
 * Asks before taking a claim back. Withdrawing deletes it — there is no un-withdraw — so the
 * question names the claim it is about rather than trusting the click that led here. The
 * phone's WithdrawDialog, word for word.
 */
export default function WithdrawDialog({
  entry,
  timezone,
  busy,
  onCancel,
  onConfirm,
}: Readonly<Props>): ReactElement {
  const t = useT();
  const titleId = useId();
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

  return (
    <Dialog
      open={entry !== null}
      onClose={busy ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>{t('Withdraw this claim?')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onCancel} disabled={busy}>
          {t('Cancel')}
        </Button>
        <Button
          color="error"
          variant="contained"
          loading={busy}
          onClick={() => {
            if (entry !== null) {
              onConfirm(entry);
            }
          }}
        >
          {t('Withdraw')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
