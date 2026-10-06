import { useEffect, useRef, type ChangeEvent } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Flex,
} from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import type { FontSource } from '../../../cms/design-system/font-sources';
import { FONT_ACCEPT, fontFormatOf, useFontUpload } from '../../../cms/media';
import {
  customFontSchema,
  guessFromName,
  type CustomFontFormValues,
} from './cms-custom-font.types';
import { CustomFontFileRow } from './CustomFontFileRow';

interface CustomFontFormProps {
  open: boolean;
  siteId: string;
  onClose: () => void;
  onAdd: (source: FontSource) => void;
}

const EMPTY: CustomFontFormValues = { family: '', files: [] };

/**
 * Uploads a family of font files (WOFF2, WOFF, TTF, OTF; 5 MB each) into the site's media
 * library, one file per weight and style, and adds it to the design system.
 */
export function CustomFontForm({ open, siteId, onClose, onAdd }: Readonly<CustomFontFormProps>) {
  const t = useT();
  const notify = useNotify();
  const input = useRef<HTMLInputElement>(null);
  const upload = useFontUpload(siteId);
  const methods = useForm<CustomFontFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(customFontSchema),
    defaultValues: EMPTY,
  });
  const { control, handleSubmit, reset, formState } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'files' });
  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    for (const file of files) {
      const format = fontFormatOf(file.name);
      if (format) {
        append({ file, format, ...guessFromName(file.name) });
      } else {
        notify('{name} is not a WOFF2, WOFF, TTF or OTF font', 'error', { name: file.name });
      }
    }
  };

  const save = async (values: CustomFontFormValues) => {
    try {
      const urls = await Promise.all(values.files.map((row) => upload(row.file)));
      const files = values.files.map((row, index) => ({
        url: urls[index],
        weight: row.weight,
        style: row.style,
        format: row.format,
      }));
      onAdd({ provider: 'CUSTOM', family: values.family, files });
      notify('{family} uploaded — save the design system to use it', 'success', {
        family: values.family,
      });
      onClose();
    } catch (error) {
      notify(errorMessage(error, 'Could not upload the font'), 'error');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="custom-font-title"
    >
      <DialogTitle id="custom-font-title">{t('Upload a custom font')}</DialogTitle>
      <FormProvider {...methods}>
        <form
          noValidate
          onSubmit={(event) => {
            // Inside the design-system form in React's tree: do not submit that one too.
            event.stopPropagation();
            handleSubmit(save)(event).catch((error: unknown) =>
              notify(errorMessage(error, 'Upload failed'), 'error'),
            );
          }}
        >
          <DialogContent dividers>
            <Flex direction="column" gap={2}>
              <RhfTextField
                name="family"
                label="Family name"
                helperText="The name pages use for it, e.g. Brand Sans."
              />
              <input
                ref={input}
                type="file"
                accept={FONT_ACCEPT}
                multiple
                hidden
                onChange={onPick}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => input.current?.click()}
                sx={{ alignSelf: 'flex-start' }}
              >
                {t('Choose font files')}
              </Button>
              {fields.map((field, index) => (
                <CustomFontFileRow key={field.id} index={index} onRemove={() => remove(index)} />
              ))}
              {formState.errors.files && (
                <Alert severity="error">
                  {t(formState.errors.files.message ?? 'Check the files')}
                </Alert>
              )}
            </Flex>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('Cancel')}</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formState.isSubmitting}
              startIcon={
                formState.isSubmitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <UploadFileIcon />
                )
              }
            >
              {t('Upload and add')}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
