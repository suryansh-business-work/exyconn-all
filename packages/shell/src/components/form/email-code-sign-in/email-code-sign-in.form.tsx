import { useState, type ReactNode } from 'react';
import { useForm, FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex, Link, Text, readableInk } from '@/components/ui';
import { RhfTextField } from '@/components/form/rhf';
import { zodResolver } from '@/components/form/zodResolver';
import { errorMessage } from '@/utils/errorMessage';
import {
  signInCodeSchema,
  signInEmailSchema,
  type EmailCodeSignInProps,
  type SignInCodeValues,
  type SignInEmailValues,
} from './email-code-sign-in.types';

interface StepFrameProps<T extends FieldValues> {
  methods: UseFormReturn<T>;
  onSubmit: (values: T) => Promise<void>;
  error: string | null;
  accentColor: string;
  submitLabel: string;
  children: ReactNode;
}

/** One step's form: its error, its fields and the accent-coloured submit button. */
function StepFrame<T extends FieldValues>({
  methods,
  onSubmit,
  error,
  accentColor,
  submitLabel,
  children,
}: Readonly<StepFrameProps<T>>) {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1.5}>
          {error && <Alert severity="error">{error}</Alert>}
          {children}
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
            {submitLabel}
          </Button>
        </Flex>
      </form>
    </FormProvider>
  );
}

/**
 * Email-and-code sign-in for somebody who is not a portal user (a supplier's people in the
 * vendor portal): the address they were given access with, then the six-digit code emailed to
 * it. There is no password. The app supplies the two calls and keeps the pass it gets back.
 */
export function EmailCodeSignInForm({
  accentColor,
  requestCode,
  verifyCode,
  onSignedIn,
}: Readonly<EmailCodeSignInProps>) {
  const t = useT();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const emailForm = useForm<SignInEmailValues>({
    mode: 'onTouched',
    resolver: zodResolver(signInEmailSchema),
    defaultValues: { email: '' },
  });
  const codeForm = useForm<SignInCodeValues>({
    mode: 'onTouched',
    resolver: zodResolver(signInCodeSchema),
    defaultValues: { code: '' },
  });

  const sendCode = async ({ email }: SignInEmailValues) => {
    setError(null);
    try {
      await requestCode(email);
      setSentTo(email.trim().toLowerCase());
    } catch (err) {
      setError(errorMessage(err, t('The code could not be sent. Try again.')));
    }
  };

  const checkCode = async ({ code }: SignInCodeValues) => {
    setError(null);
    try {
      const pass = await verifyCode(sentTo ?? '', code);
      if (pass) onSignedIn(pass);
    } catch (err) {
      setError(errorMessage(err, t('The code could not be checked. Try again.')));
    }
  };

  const startOver = () => {
    setError(null);
    codeForm.reset();
    setSentTo(null);
  };

  if (sentTo === null) {
    return (
      <StepFrame
        methods={emailForm}
        onSubmit={sendCode}
        error={error}
        accentColor={accentColor}
        submitLabel={t('Email me a code')}
      >
        <RhfTextField
          name="email"
          label={t('Work email')}
          type="email"
          autoComplete="email"
          helperText={t('We email you a one-time code — no password needed')}
        />
      </StepFrame>
    );
  }

  return (
    <StepFrame
      methods={codeForm}
      onSubmit={checkCode}
      error={error}
      accentColor={accentColor}
      submitLabel={t('Sign in')}
    >
      <Text size="sm" color="text.secondary">
        {t('We emailed a six-digit code to {email}. It works for 10 minutes.', { email: sentTo })}
      </Text>
      <RhfTextField
        name="code"
        label={t('Code from the email')}
        autoComplete="one-time-code"
        autoFocus
        slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
        helperText="The six digits from the email we just sent you."
      />
      <Link
        component="button"
        type="button"
        variant="caption"
        sx={{ color: 'text.secondary', alignSelf: 'flex-start' }}
        onClick={startOver}
      >
        {t('Use a different email or send a new code')}
      </Link>
    </StepFrame>
  );
}
