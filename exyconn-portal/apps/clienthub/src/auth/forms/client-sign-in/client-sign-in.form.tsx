import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex, readableInk } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useRequestClientHubCodeMutation } from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { emailSchema, type EmailValues } from './client-sign-in.types';
import { ClientCodeStep } from './client-code.step';

interface ClientSignInFormProps {
  accentColor: string;
  onSignedIn: (pass: string) => void;
}

/**
 * Client hub sign-in: the work email an administrator gave access to, then the six-digit code
 * emailed to it. There is no password.
 */
export function ClientSignInForm({ accentColor, onSignedIn }: Readonly<ClientSignInFormProps>) {
  const t = useT();
  const [requestCode] = useRequestClientHubCodeMutation();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<EmailValues>({
    mode: 'onTouched',
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: EmailValues) => {
    setError(null);
    try {
      await requestCode({ variables: { email } });
      setSentTo(email.trim().toLowerCase());
    } catch (err) {
      setError(errorMessage(err, t('The code could not be sent. Try again.')));
    }
  };

  if (sentTo) {
    return (
      <ClientCodeStep
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
