import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex, Link, Text, readableInk } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useVerifyClientHubCodeMutation } from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { codeSchema, type CodeValues } from './client-sign-in.types';

interface ClientCodeStepProps {
  email: string;
  accentColor: string;
  onSignedIn: (pass: string) => void;
  onStartOver: () => void;
}

/** Step two: the six-digit code from the client hub email. */
export function ClientCodeStep({
  email,
  accentColor,
  onSignedIn,
  onStartOver,
}: Readonly<ClientCodeStepProps>) {
  const t = useT();
  const [verify] = useVerifyClientHubCodeMutation();
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<CodeValues>({
    mode: 'onTouched',
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = async ({ code }: CodeValues) => {
    setError(null);
    try {
      const { data } = await verify({ variables: { email, code } });
      const pass = data?.verifyClientHubCode.token;
      if (pass) onSignedIn(pass);
    } catch (err) {
      setError(errorMessage(err, t('The code could not be checked. Try again.')));
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1.5}>
          <Text size="sm" color="text.secondary">
            {t('We emailed a six-digit code to {email}. It works for 10 minutes.', { email })}
          </Text>
          {error && <Alert severity="error">{error}</Alert>}
          <RhfTextField
            name="code"
            label={t('Code from the email')}
            autoComplete="one-time-code"
            autoFocus
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
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
            {t('Sign in')}
          </Button>
          <Link
            component="button"
            type="button"
            variant="caption"
            sx={{ color: 'text.secondary', alignSelf: 'flex-start' }}
            onClick={onStartOver}
          >
            {t('Use a different email or send a new code')}
          </Link>
        </Flex>
      </form>
    </FormProvider>
  );
}
