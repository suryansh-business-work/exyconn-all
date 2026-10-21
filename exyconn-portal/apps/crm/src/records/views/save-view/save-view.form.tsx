import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useT } from '@exyconn/i18n';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Flex,
} from '@exyconn/shell/components/ui';
import { saveViewSchema, type SaveViewValues } from './save-view.types';

interface SaveViewFormProps {
  /** "Save as new view" or "Edit view". */
  title: string;
  initial: SaveViewValues;
  /** Resolves true once saved; the dialog then closes. A failure has already been reported. */
  onSubmit: (values: SaveViewValues) => Promise<boolean>;
  onClose: () => void;
}

const TITLE_ID = 'save-view-title';

/** A view's name and whether the team sees it, in a dialog (React Hook Form + Zod). */
export function SaveViewForm({ title, initial, onSubmit, onClose }: Readonly<SaveViewFormProps>) {
  const t = useT();
  const methods = useForm<SaveViewValues>({
    mode: 'onTouched',
    resolver: zodResolver(saveViewSchema),
    defaultValues: initial,
  });
  const { isSubmitting } = methods.formState;
  const submit = methods.handleSubmit(async (values) => {
    if (await onSubmit(values)) {
      onClose();
    }
  });

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby={TITLE_ID}>
      <FormProvider {...methods}>
        <Box component="form" noValidate onSubmit={submit}>
          <DialogTitle id={TITLE_ID}>{t(title)}</DialogTitle>
          <DialogContent>
            <Flex direction="column" spacing={2} sx={{ pt: 1 }}>
              <RhfTextField
                name="name"
                label="View name"
                helperText="Up to 60 characters, e.g. Hot leads this month"
              />
              <RhfSwitch name="shared" label="Share with the team" />
            </Flex>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('Cancel')}</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {t('Save')}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  );
}
