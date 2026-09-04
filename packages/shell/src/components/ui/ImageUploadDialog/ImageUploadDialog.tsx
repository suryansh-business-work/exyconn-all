import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs } from '@exyconn/ui';
import type { PexelsMediaFieldsFragment } from '@/graphql/generated';
import { DeviceUploadTab } from './DeviceUploadTab';
import { MediaReview } from './MediaReview';
import { PexelsTab } from './PexelsTab';
import type { CropRect } from './crop-image';
import { useMediaUpload } from './useMediaUpload';

/**
 * What the dialog is allowed to return. Image fields (`RhfImageField`) pass `image`
 * so a clip can never land in a field that renders an `<img>`.
 */
export type UploadMediaKind = 'image' | 'all';

type TabKey = 'device' | 'photos' | 'videos';

interface ImageUploadDialogProps {
  open: boolean;
  title?: string;
  /** Groups the upload on ImageKit (e.g. "branding", "blog"). */
  folder?: string;
  currentUrl?: string | null;
  /** `all` adds the stock video tab; `image` stops at device + stock photos. */
  media?: UploadMediaKind;
  onClose: () => void;
  onUploaded: (url: string) => void;
}

/**
 * The platform's single upload dialog. Three ways in — a file from the device, a Pexels
 * photo, or a Pexels clip — and one way out: an ImageKit URL handed to `onUploaded`.
 * Picking only selects; the crop step and the Upload button come next, and the dialog
 * stays open until Upload or Cancel is pressed (never on a backdrop click or Escape).
 */
export function ImageUploadDialog({
  open,
  title = 'Upload',
  folder,
  currentUrl,
  media = 'all',
  onClose,
  onUploaded,
}: Readonly<ImageUploadDialogProps>) {
  const [tab, setTab] = useState<TabKey>('device');
  const [crop, setCrop] = useState<CropRect | null>(null);
  const upload = useMediaUpload(folder, (url) => {
    setCrop(null);
    onUploaded(url);
    onClose();
  });
  const { selection } = upload;

  const handleBack = () => {
    upload.clear();
    setCrop(null);
  };

  const handleCancel = () => {
    handleBack();
    onClose();
  };

  const handlePickStock = (item: PexelsMediaFieldsFragment) => {
    setCrop(null);
    upload.pickStock(item);
  };

  return (
    <Dialog open={open} disableEscapeKeyDown fullWidth maxWidth="sm">
      <DialogTitle>{selection ? `${title} — review` : title}</DialogTitle>
      {!selection && (
        <Tabs
          value={tab}
          onChange={(_event, next: TabKey) => setTab(next)}
          variant="fullWidth"
          aria-label="upload source"
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="device" label="From your device" />
          <Tab value="photos" label="Pexels images" />
          {media === 'all' && <Tab value="videos" label="Pexels videos" />}
        </Tabs>
      )}
      <DialogContent dividers>
        {selection && (
          <MediaReview selection={selection} uploading={upload.uploading} onCropChange={setCrop} />
        )}
        {!selection && tab === 'device' && (
          <DeviceUploadTab
            currentUrl={currentUrl ?? null}
            inputRef={upload.inputRef}
            onPick={upload.pickFile}
          />
        )}
        {!selection && tab === 'photos' && <PexelsTab kind="photos" onPick={handlePickStock} />}
        {!selection && tab === 'videos' && <PexelsTab kind="videos" onPick={handlePickStock} />}
      </DialogContent>
      <DialogActions>
        {selection && (
          <Button color="inherit" onClick={handleBack} disabled={upload.uploading}>
            Back
          </Button>
        )}
        <Button color="inherit" onClick={handleCancel} disabled={upload.uploading}>
          Cancel
        </Button>
        {selection && (
          <Button
            variant="contained"
            onClick={() => upload.upload(crop)}
            disabled={upload.uploading}
          >
            {upload.uploading ? 'Uploading…' : 'Upload'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
