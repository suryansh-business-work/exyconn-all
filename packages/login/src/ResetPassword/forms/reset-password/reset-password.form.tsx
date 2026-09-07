import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Flex } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useResetPasswordMutation } from '@exyconn/shell/graphql/generated';
import type { ResetPasswordValues } from './reset-password.types';

/** Mirrors the server's minimum, so a password it would refuse is caught before the round-trip. */
const MIN_PASSWORD_LENGTH = 6;

const schema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(MIN_PASSWORD_LENGTH, `Minimum ${MIN_PASSWORD_LENGTH} characters`),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const PASSWORD_RESET_MESSAGE = 'Password updated. Sign in with your new password.';

interface ResetPasswordFormProps {
  /** From the emailed link's query string. */
  token: string;
  /** Portal accent from branding — tints the submit button like the sign-in form. */
  accentColor: string;
}

/** Sets a new password from an emailed link, then sends the person to sign in with it. */
export function ResetPasswordForm({ token, accentColor }: Readonly<ResetPasswordFormProps>) {
  const navigate = useNavigate();
  const notify = useNotify();
  const [resetPassword] = useResetPasswordMutation();
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    setError(null);
    try {
      await resetPassword({ variables: { token, newPassword: values.newPassword } });
      notify(PASSWORD_RESET_MESSAGE, 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not reset the password'));
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <RhfTextField
            name="newPassword"
            type="password"
            placeholder="new password"
            autoComplete="new-password"
            autoFocus
          />
          <RhfTextField
            name="confirmPassword"
            type="password"
            placeholder="confirm new password"
            autoComplete="new-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={methods.formState.isSubmitting}
            sx={{ bgcolor: accentColor, py: 1, '&:hover': { bgcolor: accentColor, opacity: 0.9 } }}
          >
            Set new password
          </Button>
        </Flex>
      </form>
    </FormProvider>
  );
}
