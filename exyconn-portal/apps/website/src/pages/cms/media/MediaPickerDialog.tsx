import { useT } from '@exyconn/i18n';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@exyconn/shell/components/ui';
import { MediaLibrary } from './MediaLibrary';

interface MediaPickerDialogProps {
  open: boolean;
  siteId: string;
  title?: string;
  onClose: () => void;
  onPick: (url: string) => void;
}

/** The site's media library as a picker: choose a file, or upload one and use it. */
export function MediaPickerDialog({
  open,
  siteId,
  title = 'Choose from media',
  onClose,
  onPick,
}: Readonly<MediaPickerDialogProps>) {
  const t = useT();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="media-picker-title"
    >
      <DialogTitle id="media-picker-title">{t(title)}</DialogTitle>
      <DialogContent dividers>
        {open && (
          <MediaLibrary
            siteId={siteId}
            onPick={(url) => {
              onPick(url);
              onClose();
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}
