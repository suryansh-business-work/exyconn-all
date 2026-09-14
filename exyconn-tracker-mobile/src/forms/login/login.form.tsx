import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { CheckboxField } from '../../components/form/CheckboxField';
import { TextField } from '../../components/form/TextField';
import { AppButton } from '../../components/ui/AppButton';
import { Notice } from '../../components/ui/Notice';
import { tracker } from '../../tracker/instance';
import { messageOf } from '../../tracker/run';
import { loginSchema } from './login.schema';
import type { LoginValues } from './login.types';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

interface Props {
  /** "Remember me" starts where the stored session left it. */
  rememberMe: boolean;
}

/**
 * Sign-in with portal credentials. On success the tracker publishes a signed-in state and the
 * router moves on by itself; only a failure is this form's to show — in the controller's plain
 * sentence, never a status code.
 */
export function LoginForm({ rememberMe }: Readonly<Props>) {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe },
  });
  const busy = formState.isSubmitting;

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      const result = await tracker.login(values.email.trim(), values.password, values.rememberMe);
      if (!result.ok) {
        setError(result.error ?? t(GENERIC_ERROR));
      }
    } catch (cause: unknown) {
      console.error('Login request failed', cause);
      setError(messageOf(cause, t(GENERIC_ERROR)));
    }
  });

  return (
    <YStack gap="$3">
      <TextField
        control={control}
        name="email"
        label={t('Email')}
        keyboardType="email-address"
        autoComplete="email"
        autoCapitalize="none"
        disabled={busy}
      />
      <TextField
        control={control}
        name="password"
        label={t('Password')}
        secret
        autoComplete="password"
        disabled={busy}
        onSubmitEditing={() => {
          submit().catch((cause: unknown) => console.error('Sign in failed', cause));
        }}
      />
      <CheckboxField
        control={control}
        name="rememberMe"
        label={t('Remember me on this phone')}
        disabled={busy}
      />
      {error === null ? null : <Notice severity="error">{error}</Notice>}
      <AppButton
        label={busy ? t('Signing in…') : t('Sign in')}
        icon="login"
        busy={busy}
        full
        onPress={() => {
          submit().catch((cause: unknown) => console.error('Sign in failed', cause));
        }}
      />
    </YStack>
  );
}
