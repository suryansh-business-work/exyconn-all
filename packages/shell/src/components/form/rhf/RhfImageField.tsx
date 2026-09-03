import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import {
  Box,
  Button,
  ImagePreview,
  ImageUploadDialog,
  Stack,
  TextField,
  Typography,
} from '@/components/ui';

interface RhfImageFieldProps {
  name: string;
  label: string;
  /** Groups the upload on ImageKit (e.g. "branding"). */
  folder?: string;
  helperText?: string;
  /**
   * Shows the URL as an editable input instead of a caption, so an image already hosted
   * elsewhere (a stock photo, a CDN asset) can be pasted in without an upload.
   */
  editableUrl?: boolean;
}

/**
 * React Hook Form-bound image field: previews the current URL and opens the
 * shared ImageUploadDialog, writing the hosted URL back into the form value.
 */
export function RhfImageField({
  name,
  label,
  folder,
  helperText,
  editableUrl = false,
}: Readonly<RhfImageFieldProps>) {
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const url: string = field.value ?? '';
        const error = fieldState.error?.message;
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
              {label}
            </Typography>
            <Stack spacing={1}>
              <ImagePreview url={url || null} />
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => setOpen(true)}
                >
                  Change
                </Button>
                {url && (
                  <Button size="small" color="inherit" onClick={() => field.onChange('')}>
                    Remove
                  </Button>
                )}
              </Stack>
              {editableUrl ? (
                <TextField
                  name={field.name}
                  value={url}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  placeholder="https://…"
                  inputProps={{ 'aria-label': label }}
                  error={Boolean(error)}
                  helperText={error ?? helperText}
                />
              ) : (
                <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>
                  {error ?? helperText ?? url}
                </Typography>
              )}
            </Stack>
            <ImageUploadDialog
              open={open}
              title={label}
              folder={folder}
              currentUrl={url || null}
              media="image"
              onClose={() => setOpen(false)}
              onUploaded={(uploaded) => field.onChange(uploaded)}
            />
          </Box>
        );
      }}
    />
  );
}
