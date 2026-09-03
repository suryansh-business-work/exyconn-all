import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs } from '@exyconn/ui';
import type { PexelsMediaFieldsFragment } from '@/graphql/generated';
import { DeviceUploadTab } from './DeviceUploadTab';
import { PexelsTab } from './PexelsTab';
import { useDeviceUpload } from './useDeviceUpload';

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
 * The platform's single upload dialog. Three ways in — a file from the device (uploaded
 * to ImageKit through the one `uploadImage` mutation), a Pexels photo, or a Pexels clip —
 * and one way out: the hosted URL handed to `onUploaded`. Stock results are returned as
 * their Pexels CDN URL, which is how a stock asset is meant to be referenced.
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
  const device = useDeviceUpload(folder, (url) => {
    onUploaded(url);
    onClose();
  });

  const handleClose = () => {
    device.reset();
    onClose();
  };

  const handlePickStock = (item: PexelsMediaFieldsFragment) => {
    onUploaded(item.url);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
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
      <DialogContent dividers>
        {tab === 'device' && (
          <DeviceUploadTab
            previewUrl={device.preview ?? currentUrl ?? null}
            uploading={device.uploading}
            inputRef={device.inputRef}
            onPick={device.pick}
          />
        )}
        {tab === 'photos' && <PexelsTab kind="photos" onPick={handlePickStock} />}
        {tab === 'videos' && <PexelsTab kind="videos" onPick={handlePickStock} />}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={handleClose} disabled={device.uploading}>
          Cancel
        </Button>
        {tab === 'device' && (
          <Button
            variant="contained"
            onClick={device.upload}
            disabled={!device.file || device.uploading}
          >
            {device.uploading ? 'Uploading…' : 'Upload'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
