import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Button, Flex, Text } from '@/components/ui';
import { RhfTextField } from '@/components/form/rhf';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import { useDisableMfaMutation } from '@/graphql/generated';
import type { DisableTwoFactorValues } from './two-factor.types';

const schema = z.object({
  password: z.string().min(1, 'Your password is required'),
});

interface DisableTwoFactorFormProps {
  onDisabled: () => void;
  onCancel: () => void;
}

/**
 * Switching two-factor off, which costs the password.
 *
 * A screen somebody walked away from must not be enough to take the second factor off the
 * account — that would make the whole thing a formality.
 */
export function DisableTwoFactorForm({
  onDisabled,
  onCancel,
}: Readonly<DisableTwoFactorFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [disable] = useDisableMfaMutation();
  const methods = useForm<DisableTwoFactorValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (values: DisableTwoFactorValues) => {
    try {
      await disable({ variables: { password: values.password } });
      notify(t('Two-factor authentication is off.'), 'success');
      onDisabled();
    } catch (err) {
      notify(errorMessage(err, t('That password was not accepted.')), 'error');
      methods.reset({ password: '' });
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1}>
          <Text size="sm" color="text.secondary">
            {t('Confirm your password to turn two-factor authentication off.')}
          </Text>
          <RhfTextField
            name="password"
            label={t('Password')}
            type="password"
            autoComplete="current-password"
          />
          <Flex direction="row" spacing={1}>
            <Button
              type="submit"
              variant="contained"
              color="error"
              disabled={methods.formState.isSubmitting}
            >
              {t('Turn off')}
            </Button>
            <Button variant="text" onClick={onCancel}>
              {t('Cancel')}
            </Button>
          </Flex>
        </Flex>
      </form>
    </FormProvider>
  );
}
