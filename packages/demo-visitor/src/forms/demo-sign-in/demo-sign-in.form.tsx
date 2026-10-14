import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex, readableInk } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import {
  useRequestWhatsappDemoCodeMutation,
  WhatsappDemoVisitorSource,
} from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { detailsSchema, type DetailsValues } from './demo-sign-in.types';
import { CodeStep } from './demo-code.step';

interface DemoSignInFormProps {
  /** Branding accent — tints the actions like every portal's sign-in. */
  accentColor: string;
  /** Called with the demo pass once the visitor is signed in. */
  onSignedIn: (pass: string) => void;
}

/**
 * Email-and-code sign-in for the WhatsApp demo: name and work email, then the six-digit code
 * from the email. No password exists for a visitor. The address is filed as a lead in
 * Website › WhatsApp Leads.
 */
export function DemoSignInForm({ accentColor, onSignedIn }: Readonly<DemoSignInFormProps>) {
  const t = useT();
  const [requestCode] = useRequestWhatsappDemoCodeMutation();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<DetailsValues>({
    mode: 'onTouched',
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: '', email: '' },
  });

  const onSubmit = async (values: DetailsValues) => {
    setError(null);
    try {
      await requestCode({
        variables: { input: { ...values, source: WhatsappDemoVisitorSource.DemoLogin } },
      });
      setSentTo(values.email.trim().toLowerCase());
    } catch (err) {
      setError(errorMessage(err, t('The code could not be sent. Try again.')));
    }
  };

  if (sentTo) {
    return (
      <CodeStep
        email={sentTo}
        accentColor={accentColor}
        onSignedIn={onSignedIn}
        onStartOver={() => setSentTo(null)}
      />
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <RhfTextField name="name" label={t('Your name')} autoComplete="name" />
          <RhfTextField
            name="email"
            label={t('Work email')}
            type="email"
            autoComplete="email"
            helperText={t('We email you a one-time code — no password needed')}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            loading={methods.formState.isSubmitting}
            sx={{
              bgcolor: accentColor,
              color: readableInk(accentColor),
              py: 1,
              '&:hover': { bgcolor: accentColor, opacity: 0.9 },
            }}
          >
            {t('Email me a code')}
          </Button>
        </Flex>
      </form>
    </FormProvider>
  );
}
