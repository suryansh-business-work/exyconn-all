import { Box, LinearProgress, Stack, Typography } from '@exyconn/ui';
import { ImageCropper } from './ImageCropper';
import type { CropRect } from './crop-image';
import { isCroppable, type MediaSelection } from './useMediaUpload';

interface MediaReviewProps {
  selection: MediaSelection;
  uploading: boolean;
  onCropChange: (rect: CropRect) => void;
}

/**
 * The step between picking and uploading. An image lands on the crop canvas so the framing
 * is chosen before anything is sent; a clip and a vector have nothing to crop, so they are
 * only previewed. Upload happens from the dialog's action bar, never on selection.
 */
export function MediaReview({ selection, uploading, onCropChange }: Readonly<MediaReviewProps>) {
  return (
    <Stack spacing={1.5}>
      {isCroppable(selection) && (
        <ImageCropper src={selection.previewUrl} onCropChange={onCropChange} />
      )}
      {selection.isVideo && (
        <Box
          component="video"
          src={selection.stockUrl}
          poster={selection.previewUrl}
          controls
          preload="metadata"
          sx={{ width: '100%', maxHeight: 280, borderRadius: 1, bgcolor: 'common.black' }}
        />
      )}
      {selection.isVector && (
        <Box
          component="img"
          src={selection.previewUrl}
          alt={selection.fileName}
          sx={{ width: '100%', maxHeight: 280, objectFit: 'contain' }}
        />
      )}
      <Typography variant="caption" color="text.secondary">
        {selection.fileName}
      </Typography>
      {uploading && <LinearProgress />}
    </Stack>
  );
}
