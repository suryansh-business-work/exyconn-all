import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@exyconn/ui';
import { useT } from '@exyconn/i18n';

interface Props {
  open: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks the user to confirm that everyone in the call knows it is being recorded (the audio is
 * saved, per the company's retention) and transcribed. Nothing is recorded until they confirm; the confirmation is stored on the server (maRecordConsent).
 */
export function ConsentDialog({ open, busy, onConfirm, onCancel }: Readonly<Props>) {
  const t = useT();
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="exy-consent-title"
      aria-describedby="exy-consent-text"
    >
      <DialogTitle id="exy-consent-title">{t('Record and transcribe this meeting?')}</DialogTitle>
      <DialogContent>
        <DialogContentText id="exy-consent-text">
          {t(
            'Exyconn will record the meeting audio from this tab, save the recording for as long as your company keeps recordings, and transcribe it to create notes and action items. Confirm that everyone in the call has been told it is being recorded and transcribed.',
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          {t('Cancel')}
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={busy}>
          {t('Everyone has been told — start')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
