import { useState, type ChangeEvent } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Text,
} from '@exyconn/shell/components/ui';
import { SignaturePad } from '@exyconn/shell/components/signature';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { fileToDataUrl, MAX_IMAGE_BYTES } from '@exyconn/shell/utils/file';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { PdfStamp } from './pdf-editor.types';

interface StampDialogProps {
  kind: 'image' | 'signature' | null;
  onClose: () => void;
  /** The picture to place, with its height-to-width ratio. */
  onReady: (stamp: PdfStamp) => void;
}

const PICTURE_TYPES = new Set(['image/png', 'image/jpeg']);

/** Reads a picture's height-to-width ratio, so it is placed undistorted. */
function aspectOf(src: string): Promise<number> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalHeight / image.naturalWidth || 0.3);
    image.onerror = () => resolve(0.3);
    image.src = src;
  });
}

/** Asks for the picture the Image or Signature tool will place: a PNG/JPEG, or a signature. */
export function StampDialog({ kind, onClose, onReady }: Readonly<StampDialogProps>) {
  const t = useT();
  const notify = useNotify();
  const [signature, setSignature] = useState('');

  const ready = async (src: string) => {
    onReady({ src, aspect: await aspectOf(src) });
    setSignature('');
  };

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!PICTURE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
      notify('Choose a PNG or JPEG image under 5 MB', 'error');
      return;
    }
    try {
      await ready(await fileToDataUrl(file));
    } catch (error) {
      portalLogger.error('Legal: reading an image for the PDF failed', error);
      notify('The image could not be read. Try another file.', 'error');
    }
  };

  // A signature drawn and then cancelled must not be the one placed next time.
  const close = () => {
    setSignature('');
    onClose();
  };

  return (
    <Dialog open={kind !== null} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>
        {kind === 'signature' ? t('Add your signature') : t('Add an image')}
      </DialogTitle>
      <DialogContent>
        {kind === 'signature' ? (
          <SignaturePad
            label="Signature"
            onChange={setSignature}
            helperText="Then click on the page where it should go."
          />
        ) : (
          <>
            <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
              {t('PNG or JPEG, up to 5 MB. Then click on the page where it should go.')}
            </Text>
            <Button variant="outlined" component="label">
              {t('Choose image')}
              <input hidden type="file" accept="image/png,image/jpeg" onChange={pick} />
            </Button>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>{t('Cancel')}</Button>
        {kind === 'signature' && (
          <Button variant="contained" disabled={!signature} onClick={() => ready(signature)}>
            {t('Place on page')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
