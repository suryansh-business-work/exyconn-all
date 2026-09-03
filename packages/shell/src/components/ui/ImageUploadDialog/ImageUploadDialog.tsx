import { useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from '@exyconn/ui';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useUploadImageMutation } from '@/graphql/generated';
import { fileToDataUrl, MAX_IMAGE_BYTES } from '@/utils/file';
import { ImagePreview } from './ImagePreview';

const MAX_MB = MAX_IMAGE_BYTES / (1024 * 1024);

interface ImageUploadDialogProps {
  open: boolean;
  title?: string;
  /** Groups the upload on ImageKit (e.g. "branding", "blog"). */
  folder?: string;
  currentUrl?: string | null;
  onClose: () => void;
  onUploaded: (url: string) => void;
}

/**
 * Shared image picker + uploader. Every image field in the portal goes through
 * this dialog and the single `uploadImage` mutation (ImageKit) behind it.
 */
export function ImageUploadDialog({
  open,
  title = 'Upload image',
  folder,
  currentUrl,
  onClose,
  onUploaded,
}: Readonly<ImageUploadDialogProps>) {
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadImage] = useUploadImageMutation();

  const reset = () => {
    setFile(null);
    setPreview(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    if (picked.size > MAX_IMAGE_BYTES) {
      notify(`Image must be ${MAX_MB} MB or smaller`, 'error');
      return;
    }
    try {
      setPreview(await fileToDataUrl(picked));
      setFile(picked);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not read the file', 'error');
    }
  };

  const handleUpload = async () => {
    if (!file || !preview) return;
    setUploading(true);
    try {
      const { data } = await uploadImage({
        variables: { file: preview, fileName: file.name, folder },
      });
      const url = data?.uploadImage;
      if (!url) throw new Error('Upload returned no URL');
      notify('Image uploaded');
      onUploaded(url);
      reset();
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} alignItems="center">
          <ImagePreview url={preview ?? currentUrl ?? null} />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePick}
            data-testid="image-upload-input"
          />
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            Choose image
          </Button>
          <Typography variant="caption" color="text.secondary">
            PNG, JPG or SVG · up to {MAX_MB} MB
          </Typography>
          {uploading && <LinearProgress sx={{ width: '100%' }} />}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
