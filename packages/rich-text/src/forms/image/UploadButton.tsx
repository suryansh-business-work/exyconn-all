import { useState, type ChangeEvent } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Box, Button, CircularProgress } from '@exyconn/ui';
import type { UploadImage } from '../../types';

interface UploadButtonProps {
  uploadImage: UploadImage;
  onUploaded: (url: string, file: File) => void;
  onFailed: (message: string) => void;
}

/** Picks one image from the device and uploads it through the host's `uploadImage`. */
export function UploadButton({ uploadImage, onUploaded, onFailed }: Readonly<UploadButtonProps>) {
  const [uploading, setUploading] = useState(false);

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      onUploaded(await uploadImage(file), file);
    } catch (error) {
      onFailed(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Button
      component="label"
      variant="outlined"
      disabled={uploading}
      startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
      sx={{ alignSelf: 'flex-start' }}
    >
      {uploading ? 'Uploading…' : 'Upload from device'}
      <Box
        component="input"
        type="file"
        accept="image/*"
        onChange={pick}
        sx={{ display: 'none' }}
        aria-label="Image file"
      />
    </Button>
  );
}
