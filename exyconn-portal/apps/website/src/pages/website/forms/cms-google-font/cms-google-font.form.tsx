import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Flex,
  Grid,
  MenuItem,
  TextField,
} from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import type { FontSource } from '../../../cms/design-system/font-sources';
import {
  GOOGLE_FONT_CATEGORIES,
  googleFontSchema,
  listVariant,
  type GoogleFontFormValues,
  type GoogleFontRow,
} from './cms-google-font.types';
import { GoogleFontList } from './GoogleFontList';
import { GoogleFontDetails } from './GoogleFontDetails';
import { useGoogleFontCatalogue } from './useGoogleFontCatalogue';

interface GoogleFontFormProps {
  open: boolean;
  /** Families already loaded, which cannot be added twice. */
  loaded: readonly string[];
  onClose: () => void;
  onAdd: (source: FontSource) => void;
}

/** Search the Google Fonts catalogue, preview a family and choose the styles to load. */
export function GoogleFontForm({ open, loaded, onClose, onAdd }: Readonly<GoogleFontFormProps>) {
  const t = useT();
  const catalogue = useGoogleFontCatalogue(open);
  const [row, setRow] = useState<GoogleFontRow | null>(null);
  const methods = useForm<GoogleFontFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(googleFontSchema),
    defaultValues: { family: '', variants: [] },
  });
  const { reset, handleSubmit, setError } = methods;

  const select = (picked: GoogleFontRow) => {
    setRow(picked);
    const regular = listVariant(picked);
    const bold = picked.variants.includes('700') ? ['700'] : [];
    reset({ family: picked.family, variants: [regular, ...bold.filter((v) => v !== regular)] });
  };

  const submit = handleSubmit((values) => {
    if (loaded.some((family) => family.toLowerCase() === values.family.toLowerCase())) {
      setError('family', { message: 'This family is already loaded' });
      return;
    }
    onAdd({ provider: 'GOOGLE', family: values.family, variants: values.variants });
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="google-font-title"
    >
      <DialogTitle id="google-font-title">{t('Add a Google font')}</DialogTitle>
      <FormProvider {...methods}>
        {/* The dialog sits inside the design-system form in React's tree, so its submit must
            not bubble up and save the design system too. */}
        <form
          noValidate
          onSubmit={(event) => {
            event.stopPropagation();
            submit(event).catch((error: unknown) =>
              setError('family', { message: errorMessage(error, 'Could not add the family') }),
            );
          }}
        >
          <DialogContent dividers>
            <Flex gap={1.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label={t('Search families')}
                value={catalogue.search}
                onChange={(event) => catalogue.setSearch(event.target.value)}
                sx={{ flexGrow: 1 }}
              />
              <TextField
                select
                size="small"
                label={t('Category')}
                value={catalogue.category}
                onChange={(event) => catalogue.setCategory(event.target.value)}
                sx={{ minWidth: 180 }}
                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
              >
                <MenuItem value="">{t('Every category')}</MenuItem>
                {GOOGLE_FONT_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {t(category)}
                  </MenuItem>
                ))}
              </TextField>
            </Flex>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <GoogleFontList
                  catalogue={catalogue}
                  selected={row?.family ?? ''}
                  onSelect={select}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <GoogleFontDetails row={row} />
                {methods.formState.errors.family && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {t(String(methods.formState.errors.family.message))}
                  </Alert>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('Cancel')}</Button>
            <Button type="submit" variant="contained" disabled={!row}>
              {t('Add family')}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
