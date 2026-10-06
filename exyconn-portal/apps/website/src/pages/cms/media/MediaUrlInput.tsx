import { useState } from 'react';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, TextField } from '@exyconn/shell/components/ui';
import { MediaPickerDialog } from './MediaPickerDialog';

interface MediaUrlInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onBlur?: () => void;
  /** The site whose library is offered; without one only a URL can be typed. */
  siteId?: string;
  error?: string;
  helperText?: string;
}

const IMAGE_URL = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

/** A URL field with a thumbnail and a "Choose" button opening the site's media library. */
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
  const [open, setOpen] = useState(false);
  const showThumb = IMAGE_URL.test(value) || value.includes('ik.imagekit.io');

  return (
    <Box>
      <Flex gap={1} alignItems="flex-start">
        {showThumb && (
          <Box
            component="img"
            src={value}
            alt=""
            sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
          />
        )}
        <TextField
          label={t(label)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder="https://…"
          error={Boolean(error)}
          helperText={error ?? (helperText ? t(helperText) : undefined)}
          sx={{ flexGrow: 1 }}
        />
        {siteId && (
          <Button
            variant="outlined"
            startIcon={<PermMediaIcon />}
            onClick={() => setOpen(true)}
            sx={{ mt: 1, flexShrink: 0 }}
          >
            {t('Choose')}
          </Button>
        )}
      </Flex>
      {siteId && (
        <MediaPickerDialog
          open={open}
          siteId={siteId}
          title={label}
          onClose={() => setOpen(false)}
          onPick={onChange}
        />
      )}
    </Box>
  );
}
