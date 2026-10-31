import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Stack } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useAddVendorContactMutation } from '@exyconn/shell/graphql/generated';
import { vendorContactSchema, type VendorContactFormValues } from './vendor-contact.types';

interface VendorContactFormProps {
  supplierId: string;
  onAdded: () => void;
}

/**
 * Gives one more person at the supplier access to the vendor portal. They are emailed where to
 * sign in; signing in is their email and a one-time code — there is no password to hand over.
 */
export function VendorContactForm({ supplierId, onAdded }: Readonly<VendorContactFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [addContact] = useAddVendorContactMutation();
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<VendorContactFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(vendorContactSchema),
    defaultValues: { name: '', email: '' },
  });

  const onSubmit = async (values: VendorContactFormValues) => {
    setError(null);
    try {
      await addContact({ variables: { input: { supplierId, ...values } } });
      notify('Access given — {email} has been emailed', 'success', { email: values.email });
      methods.reset();
      onAdded();
    } catch (err) {
      setError(errorMessage(err, t('Could not give access')));
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing={1.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <RhfTextField
            name="name"
            label={t('Name')}
            autoComplete="off"
            helperText="The contact's full name, used to greet them in portal emails."
          />
          <RhfTextField
            name="email"
            label={t('Email')}
            type="email"
            autoComplete="off"
            helperText={t('They sign in with this address and an emailed code')}
          />
          <Button
            type="submit"
            variant="contained"
            loading={methods.formState.isSubmitting}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('Give access')}
          </Button>
        </Stack>
      </form>
    </FormProvider>
  );
}
