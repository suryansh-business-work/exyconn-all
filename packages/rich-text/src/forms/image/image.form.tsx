import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@exyconn/ui';
import type { UploadImage } from '../../types';
import { FormTextField } from '../FormTextField';
import { isolatedSubmit } from '../isolated-submit';
import { UploadButton } from './UploadButton';
import type { ImageFormValues } from './image.types';

export const IMAGE_MESSAGES = {
  srcRequired: 'Upload an image or paste its URL',
  srcInvalid: 'Use a full https:// address',
  altRequired: 'Describe the image for readers who cannot see it',
} as const;

const schema = z.object({
  src: z
    .string()
    .trim()
    .min(1, IMAGE_MESSAGES.srcRequired)
    .regex(/^https?:\/\/\S+$/i, IMAGE_MESSAGES.srcInvalid),
  alt: z
    .string()
    .trim()
    .min(1, IMAGE_MESSAGES.altRequired)
    .max(250, 'Alt text must be 250 characters or fewer'),
  title: z.string().trim().max(250, 'Title must be 250 characters or fewer'),
});

const EMPTY: ImageFormValues = { src: '', alt: '', title: '' };

/** "team-offsite_2026.jpg" -> "team offsite 2026", a starting point for the alt text. */
export const altFromFileName = (name: string): string =>
  name
    .replace(/\.[^.]+$/, '')
    .replaceAll(/[-_]+/g, ' ')
    .trim();

interface ImageFormProps {
  uploadImage: UploadImage;
  onSubmit: (values: ImageFormValues) => void;
  onClose: () => void;
}

/** Inserts an image: uploaded from the device, or an address that is already hosted. */
export function ImageForm({ uploadImage, onSubmit, onClose }: Readonly<ImageFormProps>) {
  const methods = useForm<ImageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });
  const src = useWatch({ control: methods.control, name: 'src' });
  const showPreview = /^https?:\/\//i.test(src);

  const onUploaded = (url: string, file: File) => {
    methods.setValue('src', url, { shouldValidate: true });
    if (!methods.getValues('alt')) {
      methods.setValue('alt', altFromFileName(file.name));
    }
  };

  const onUploadFailed = (message: string) => methods.setError('src', { message });

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <FormProvider {...methods}>
        <form noValidate onSubmit={isolatedSubmit(methods, onSubmit)}>
          <DialogTitle>Insert image</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <UploadButton
              uploadImage={uploadImage}
              onUploaded={onUploaded}
              onFailed={onUploadFailed}
            />
            <FormTextField
              name="src"
              label="Image URL"
              placeholder="https://ik.imagekit.io/…"
              helperText="Filled in by the upload, or paste an image that is already hosted"
            />
            {showPreview && (
              <Box
                component="img"
                src={src}
                alt=""
                sx={{ maxHeight: 220, objectFit: 'contain', borderRadius: 1, bgcolor: 'grey.100' }}
              />
            )}
            <FormTextField
              name="alt"
              label="Alt text"
              helperText="Read aloud by screen readers and shown if the image fails to load"
            />
            <FormTextField
              name="title"
              label="Title (optional)"
              helperText="Shown as a tooltip when the image is hovered"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Insert
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
