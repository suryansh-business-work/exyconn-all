import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { Box, Button, ImagePreview, ImageUploadDialog, Stack, Typography } from '@/components/ui';

interface RhfImageFieldProps {
  name: string;
  label: string;
  /** Groups the upload on ImageKit (e.g. "branding"). */
  folder?: string;
  helperText?: string;
}

/**
 * React Hook Form-bound image field: previews the current URL and opens the
 * shared ImageUploadDialog, writing the hosted URL back into the form value.
 */
export function RhfImageField({ name, label, folder, helperText }: Readonly<RhfImageFieldProps>) {
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
              <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>
                {error ?? helperText ?? url}
              </Typography>
            </Stack>
            <ImageUploadDialog
              open={open}
              title={label}
              folder={folder}
              currentUrl={url || null}
              onClose={() => setOpen(false)}
              onUploaded={(uploaded) => field.onChange(uploaded)}
            />
          </Box>
        );
      }}
    />
  );
}
