import { Button, Stack, Typography } from '@exyconn/ui';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ImagePreview } from './ImagePreview';
import { MAX_MB } from './useMediaUpload';

interface DeviceUploadTabProps {
  currentUrl: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/** "From your device" tab: shows what the field holds today and opens the file picker. */
export function DeviceUploadTab({ currentUrl, inputRef, onPick }: Readonly<DeviceUploadTabProps>) {
  return (
    <Stack spacing={2} alignItems="center">
      <ImagePreview url={currentUrl} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPick}
        data-testid="image-upload-input"
      />
      <Button
        variant="outlined"
        startIcon={<UploadFileIcon />}
        onClick={() => inputRef.current?.click()}
      >
        Choose image
      </Button>
      <Typography variant="caption" color="text.secondary">
        PNG, JPG or SVG · up to {MAX_MB} MB · you can crop it before uploading
      </Typography>
    </Stack>
  );
}
