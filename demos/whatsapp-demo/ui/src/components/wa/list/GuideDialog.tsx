import { useT } from '@exyconn/i18n';
import { DEMO_PHOTOS, DemoFaq, DemoPhotoFrame, DemoSteps } from '@exyconn/demo-visitor/page';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@exyconn/shell/components/ui';
import { useCompact } from '../../../theme/useWa';
import { GUIDE_FAQ, GUIDE_STEPS } from './guide.content';

/** "How this demo works": the steps to try it and the questions people ask, full screen on a phone. */
export function GuideDialog({ open, onClose }: Readonly<{ open: boolean; onClose: () => void }>) {
  const t = useT();
  const compact = useCompact();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="wa-guide-title"
      maxWidth="md"
      fullWidth
      fullScreen={compact}
      scroll="paper"
    >
      <DialogTitle id="wa-guide-title">{t('How this demo works')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <DemoPhotoFrame photo={DEMO_PHOTOS.chat} ratio={3} eager />
          <Typography color="text.secondary">
            {t(
              'Chat with sample businesses the way your customers would. Every bot here runs on Exyconn’s WhatsApp Business automation, the same one we set up for clients.',
            )}
          </Typography>
          <DemoSteps steps={GUIDE_STEPS} />
          <Typography variant="h6" component="h3">
            {t('Questions people ask')}
          </Typography>
          <DemoFaq items={GUIDE_FAQ} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {t('Start chatting')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
