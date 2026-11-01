import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ONE_TIME_CODE } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { Alert, Button, Flex, Link, Text, readableInk } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useCompleteSignupMutation } from '@exyconn/shell/graphql/generated';
import { useAuth, type AuthUser } from '@exyconn/shell/auth/AuthContext';
import type { SignupFormValues } from '../signup';
import type { SignupCodeFormValues } from './signup-code.types';

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Enter the code from the email')
    .regex(ONE_TIME_CODE, 'The code is six digits'),
});

interface SignupCodeFormProps {
  details: SignupFormValues;
  accentColor: string;
  /** Back to the first step, e.g. to fix a mistyped email. */
  onStartOver: () => void;
}

/** Step two: the emailed code creates the company and signs its administrator in. */
export function SignupCodeForm({
  details,
  accentColor,
  onStartOver,
}: Readonly<SignupCodeFormProps>) {
  const t = useT();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [complete] = useCompleteSignupMutation();
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<SignupCodeFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  const onSubmit = async ({ code }: SignupCodeFormValues) => {
    setError(null);
    try {
      const { data } = await complete({
        variables: {
          input: {
            ...details,
            country: details.country || null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            code,
          },
        },
      });
      const result = data?.completeSignup;
      if (result?.token && result.user) {
        signIn(result.token, result.user as AuthUser);
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('The company could not be created'));
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1.5}>
          <Text size="sm" color="text.secondary">
            {t('We sent a six-digit code to {email}.', { email: details.email })}
          </Text>
          {error && <Alert severity="error">{t(error)}</Alert>}
          <RhfTextField
            name="code"
            label="Code"
            autoComplete="one-time-code"
            inputMode="numeric"
            helperText="It works once and expires in a few minutes."
          />
          <Button
            type="submit"
            fullWidth
            disabled={methods.formState.isSubmitting}
            sx={{ bgcolor: accentColor, color: readableInk(accentColor) }}
          >
            {t('Create my company')}
          </Button>
          <Link component="button" type="button" onClick={onStartOver}>
            {t('Use a different email')}
          </Link>
        </Flex>
      </form>
    </FormProvider>
  );
}
