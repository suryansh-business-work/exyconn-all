import { Box } from '@exyconn/ui';
import ImageIcon from '@mui/icons-material/Image';

const FRAME = {
  width: '100%',
  height: 160,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 1,
  border: '1px dashed',
  borderColor: 'divider',
  overflow: 'hidden',
} as const;

/** Shows the picked file, else the existing image, else an empty placeholder. */
export function ImagePreview({ url }: Readonly<{ url: string | null }>) {
  if (!url) {
    return (
      <Box sx={FRAME}>
        <ImageIcon color="disabled" fontSize="large" />
      </Box>
    );
  }
  return (
    <Box sx={FRAME}>
      <Box
        component="img"
        src={url}
        alt="Selected preview"
        sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    </Box>
  );
}
