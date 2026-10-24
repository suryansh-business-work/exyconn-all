import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { Alert, Button, Link, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import LoginIcon from '@mui/icons-material/Login';
import { errorText } from '../../../utils/errors';
import { RhfTextField } from '../../form/RhfTextField';
import type { CodeValues, PasswordValues, SignInFormProps } from './sign-in.types';

const passwordSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

/** Six digits from the app, or a recovery code from the printout — the portal takes both. */
const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, 'Enter the six-digit code from your authenticator app')
    .max(20, 'That is longer than any code we issue'),
});

interface PasswordStepProps {
  onSubmit: (values: PasswordValues) => Promise<void>;
  error: string | null;
}

/** Step one: the portal email and password. */
function PasswordStep({ onSubmit, error }: Readonly<PasswordStepProps>) {
  const t = useT();
  const { control, handleSubmit, formState } = useForm<PasswordValues>({
    mode: 'onTouched',
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  });
  return (
    <Stack component="form" spacing={1.5} noValidate onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="body2" color="text.secondary">
        {t('Sign in with your Exyconn email and password to get meeting notes and action items.')}
      </Typography>
      {error === null ? null : <Alert severity="error">{t(error)}</Alert>}
      <RhfTextField
        control={control}
        name="email"
        label="Email"
        hint="The email you sign in to the portal with"
        type="email"
        autoComplete="username"
      />
      <RhfTextField
        control={control}
        name="password"
        label="Password"
        hint="Your portal password"
        type="password"
        autoComplete="current-password"
      />
      <Button
        type="submit"
        variant="contained"
        startIcon={<LoginIcon />}
        disabled={formState.isSubmitting}
      >
        {t('Sign in')}
      </Button>
    </Stack>
  );
}

interface CodeStepProps {
  onSubmit: (values: CodeValues) => Promise<void>;
  onStartOver: () => void;
  error: string | null;
}

/** Step two, only with two-factor on: the authenticator or recovery code. */
function CodeStep({ onSubmit, onStartOver, error }: Readonly<CodeStepProps>) {
  const t = useT();
  const { control, handleSubmit, formState } = useForm<CodeValues>({
    mode: 'onTouched',
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  });
  return (
    <Stack component="form" spacing={1.5} noValidate onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="body2" color="text.secondary">
        {t('Enter the code from your authenticator app, or one of your recovery codes.')}
      </Typography>
      {error === null ? null : <Alert severity="error">{t(error)}</Alert>}
      <RhfTextField
        control={control}
        name="code"
        label="Code"
        hint="Six digits, or a recovery code"
        autoComplete="one-time-code"
        autoFocus
      />
      <Button type="submit" variant="contained" disabled={formState.isSubmitting}>
        {t('Verify')}
      </Button>
      <Link component="button" type="button" variant="body2" onClick={onStartOver}>
        {t('Use a different account')}
      </Link>
    </Stack>
  );
}

/**
 * Signs the extension in right where it is shown — the Meet panel, the popup or the options
 * page — with the portal email and password, then the two-factor code when it is on. No portal
 * page or pop-up window opens; the worker does the talking to the portal.
 */
export function SignInForm({ submitPassword, submitCode, onSignedIn }: Readonly<SignInFormProps>) {
  const [challenge, setChallenge] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settle = async (step: Promise<{ mfaChallenge: string | null }>) => {
    setError(null);
    try {
      const { mfaChallenge } = await step;
      setChallenge(mfaChallenge);
      if (mfaChallenge === null) {
        onSignedIn();
      }
    } catch (caught) {
      setError(errorText(caught, 'Could not sign in. Try again.'));
    }
  };

  const startOver = () => {
    setChallenge(null);
    setError(null);
  };

  if (challenge === null) {
    return <PasswordStep error={error} onSubmit={(values) => settle(submitPassword(values))} />;
  }
  return (
    <CodeStep
      error={error}
      onStartOver={startOver}
      onSubmit={({ code }) => settle(submitCode(challenge, code))}
    />
  );
}
