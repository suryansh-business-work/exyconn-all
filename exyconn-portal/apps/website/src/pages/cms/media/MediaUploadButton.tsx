import { useRef, useState, type ChangeEvent } from 'react';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useT } from '@exyconn/i18n';
import { Button, CircularProgress } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { MEDIA_ACCEPT, useMediaUpload } from './useMediaUpload';

interface MediaUploadButtonProps {
  siteId: string;
  /** Runs after the batch, with the URLs that went up. */
  onUploaded: (urls: string[]) => void;
}

/** Picks one or more images or PDFs and uploads them into the site's media library. */
export function MediaUploadButton({ siteId, onUploaded }: Readonly<MediaUploadButtonProps>) {
  const t = useT();
  const notify = useNotify();
  const input = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload(siteId);
  const [busy, setBusy] = useState(false);

  const uploadAll = async (files: File[]) => {
    setBusy(true);
    const results = await Promise.allSettled(files.map(upload));
    setBusy(false);
    const urls: string[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        urls.push(result.value);
      } else {
        const reason = result.reason instanceof Error ? result.reason.message : '';
        notify('Upload failed: {reason}', 'error', { reason });
      }
    }
    if (urls.length > 0) {
      notify('{count} file(s) uploaded', 'success', { count: urls.length });
    }
    onUploaded(urls);
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length > 0) {
      uploadAll(files).catch((error: unknown) =>
        notify(error instanceof Error ? error.message : 'Upload failed', 'error'),
      );
    }
  };

  return (
    <>
      <input ref={input} type="file" accept={MEDIA_ACCEPT} multiple hidden onChange={onPick} />
      <Button
        variant="contained"
        disabled={busy}
        startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
        onClick={() => input.current?.click()}
      >
        {busy ? t('Uploading…') : t('Upload')}
      </Button>
    </>
  );
}
