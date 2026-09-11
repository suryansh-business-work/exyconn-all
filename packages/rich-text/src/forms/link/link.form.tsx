import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
} from '@exyconn/ui';
import { FormTextField } from '../FormTextField';
import { isolatedSubmit } from '../isolated-submit';
import type { LinkFormValues } from './link.types';

/** A full web address, a path on the same site, or a mail / phone link. */
const LINK_PATTERN = /^(https?:\/\/\S+|\/\S*|mailto:\S+|tel:[+\d\s()-]+)$/i;

export const LINK_MESSAGES = {
  required: 'URL is required',
  invalid: 'Use a full link (https://…), a site path (/about), mailto: or tel:',
} as const;

const schema = z.object({
  href: z
    .string()
    .trim()
    .min(1, LINK_MESSAGES.required)
    .max(2048, 'URL must be 2048 characters or fewer')
    .regex(LINK_PATTERN, LINK_MESSAGES.invalid),
  openInNewTab: z.boolean(),
});

interface LinkFormProps {
  initial: LinkFormValues;
  onSubmit: (values: LinkFormValues) => void;
  onClose: () => void;
}

/** Adds or edits the link on the selected text. Mounted only while it is open. */
export function LinkForm({ initial, onSubmit, onClose }: Readonly<LinkFormProps>) {
  const methods = useForm<LinkFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });
  const isEdit = Boolean(initial.href);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <FormProvider {...methods}>
        <form noValidate onSubmit={isolatedSubmit(methods, onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit link' : 'Add link'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormTextField
              name="href"
              label="URL"
              placeholder="https://exyconn.com"
              autoFocus
              helperText="A web address, a path such as /contact, or a mailto: / tel: link"
              sx={{ mt: 1 }}
            />
            <Controller
              name="openInNewTab"
              control={methods.control}
              render={({ field }) => (
                <FormControlLabel
                  label="Open in a new tab"
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {isEdit ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
