import { useT } from '@exyconn/i18n';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@exyconn/shell/components/ui';

/** The one place the demo names itself: an Exyconn automation demo, not the real app. */
export function AboutDialog({ open, onClose }: Readonly<{ open: boolean; onClose: () => void }>) {
  const t = useT();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="wa-about-title" maxWidth="xs" fullWidth>
      <DialogTitle id="wa-about-title">{t('Exyconn automation demo')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(
            'Every chat here is simulated by Exyconn’s WhatsApp Business automation engine, running the bot workflows configured in the demo admin. No message leaves this page and no real business receives it.',
          )}
        </DialogContentText>
        <DialogContentText sx={{ mt: 2 }}>
          {t(
            'WhatsApp is a trademark of its owner. This demo is not affiliated with or endorsed by it.',
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
