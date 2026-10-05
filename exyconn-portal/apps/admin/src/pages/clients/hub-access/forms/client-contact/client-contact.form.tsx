import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Stack } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useAddClientContactMutation } from '@exyconn/shell/graphql/generated';
import type { ClientContactFormValues } from './client-contact.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Keep the name under 120 characters'),
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
});

interface ClientContactFormProps {
  clientId: string;
  onAdded: () => void;
}

/**
 * Gives one more person at the client access to the client hub. They are emailed where to sign
 * in; signing in is their email and a one-time code — there is no password to hand over.
 */
export function ClientContactForm({ clientId, onAdded }: Readonly<ClientContactFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [addContact] = useAddClientContactMutation();
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<ClientContactFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '' },
  });

  const onSubmit = async (values: ClientContactFormValues) => {
    setError(null);
    try {
      await addContact({ variables: { input: { clientId, ...values } } });
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <RhfTextField name="name" label={t('Name')} autoComplete="off" />
            <RhfTextField
              name="email"
              label={t('Email')}
              type="email"
              autoComplete="off"
              helperText={t('They sign in with this address and an emailed code')}
            />
          </Stack>
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
