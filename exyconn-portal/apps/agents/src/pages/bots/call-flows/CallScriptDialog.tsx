import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@exyconn/shell/components/ui';

interface CallScriptDialogProps {
  open: boolean;
  script: string;
  onClose: () => void;
}

/** The saved flow as the voice model reads it: added to the example's prompt on every call. */
export function CallScriptDialog({ open, script, onClose }: Readonly<CallScriptDialogProps>) {
  const t = useT();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle>{t('Call script')}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t(
            'What the voice agent follows on a call with this example, built from the saved flow.',
          )}
        </Typography>
        <Box
          component="pre"
          sx={{ m: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 'body2.fontSize' }}
        >
          {script}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
