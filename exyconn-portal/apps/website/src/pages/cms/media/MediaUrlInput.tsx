import { useState } from 'react';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, ImageUploadDialog, TextField } from '@exyconn/shell/components/ui';
import { MediaPickerDialog } from './MediaPickerDialog';
import { useMediaDataUrlUpload } from './useMediaUpload';

interface MediaUrlInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onBlur?: () => void;
  /** The site whose library uploads land in and is offered; without one, uploads go to ImageKit. */
  siteId?: string;
  error?: string;
  helperText?: string;
}

const IMAGE_URL = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

/** The shared upload dialog, storing into the site's media library. */
function LibraryUploadDialog({
  siteId,
  title,
  open,
  onClose,
  onUploaded,
}: Readonly<{
  siteId: string;
  title: string;
  open: boolean;
  onClose: () => void;
  onUploaded: (url: string) => void;
}>) {
  const uploadDataUrl = useMediaDataUrlUpload(siteId);
  return (
    <ImageUploadDialog
      open={open}
      title={title}
      media="image"
      uploadDataUrl={uploadDataUrl}
      onClose={onClose}
      onUploaded={onUploaded}
    />
  );
}

/**
 * An image field: a thumbnail, the URL (typed or pasted), "Upload" — the platform's upload
 * dialog (device or stock photo, with cropping) — and "Choose" from the site's media library.
 */
export function MediaUrlInput({
  label,
  value,
  onChange,
  onBlur,
  siteId,
  error,
  helperText,
}: Readonly<MediaUrlInputProps>) {
  const t = useT();
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const showThumb = IMAGE_URL.test(value) || value.includes('ik.imagekit.io');
  const title = t(label);

  return (
    <Box>
      <Flex gap={1} alignItems="flex-start" sx={{ flexWrap: 'wrap' }}>
        {showThumb && (
          <Box
            component="img"
            src={value}
            alt=""
            sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
          />
        )}
        <TextField
          label={title}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder="https://…"
          error={Boolean(error)}
          helperText={error ?? (helperText ? t(helperText) : undefined)}
          sx={{ flex: '1 1 240px' }}
        />
        <Button
          variant="outlined"
          startIcon={<PhotoCameraIcon />}
          onClick={() => setUploading(true)}
          sx={{ mt: 1, flexShrink: 0 }}
        >
          {t('Upload')}
        </Button>
        {siteId && (
          <Button
            variant="outlined"
            startIcon={<PermMediaIcon />}
            onClick={() => setPicking(true)}
            sx={{ mt: 1, flexShrink: 0 }}
          >
            {t('Choose')}
          </Button>
        )}
      </Flex>
      {siteId ? (
        <LibraryUploadDialog
          siteId={siteId}
          title={title}
          open={uploading}
          onClose={() => setUploading(false)}
          onUploaded={onChange}
        />
      ) : (
        <ImageUploadDialog
          open={uploading}
          title={title}
          folder="website"
          media="image"
          onClose={() => setUploading(false)}
          onUploaded={onChange}
        />
      )}
      {siteId && (
        <MediaPickerDialog
          open={picking}
          siteId={siteId}
          title={label}
          onClose={() => setPicking(false)}
          onPick={onChange}
        />
      )}
    </Box>
  );
}
