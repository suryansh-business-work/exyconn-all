import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import QRCode from 'qrcode';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Flex, Text } from '@/components/ui';
import { RhfTextField } from '@/components/form/rhf';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import { useStartMfaEnrolmentMutation, useConfirmMfaEnrolmentMutation } from '@/graphql/generated';
import type { ConfirmTwoFactorValues } from './two-factor.types';

const schema = z.object({
  code: z.string().trim().length(6, 'Enter the six digits your app is showing'),
});

interface TwoFactorFormProps {
  /** Called with the recovery codes once two-factor is on, which are shown exactly once. */
  onEnrolled: (recoveryCodes: string[]) => void;
  onCancel: () => void;
}

/**
 * Switching two-factor on: scan, type one code, done.
 *
 * The code is asked for rather than assumed, because it is the only proof the secret reached
 * the app — switching on without it is how somebody locks themselves out of their own account
 * by scanning nothing.
 */
export function TwoFactorForm({ onEnrolled, onCancel }: Readonly<TwoFactorFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [start] = useStartMfaEnrolmentMutation();
  const [confirm] = useConfirmMfaEnrolmentMutation();
  const [secret, setSecret] = useState('');
  const [qr, setQr] = useState('');
  const methods = useForm<ConfirmTwoFactorValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    let live = true;
    start()
      .then(async ({ data }) => {
        const enrolment = data?.startMfaEnrolment;
        if (!enrolment || !live) {
          return;
        }
        setSecret(enrolment.secret);
        // Rendered in the browser rather than fetched: a secret must not travel to an image
        // service to be turned into a picture.
        setQr(await QRCode.toDataURL(enrolment.uri, { margin: 1, width: 180 }));
      })
      .catch((err: unknown) =>
        notify(errorMessage(err, t('Two-factor setup could not be started.')), 'error'),
      );
    return () => {
      live = false;
    };
  }, [start, notify, t]);

  const onSubmit = async (values: ConfirmTwoFactorValues) => {
    try {
      const { data } = await confirm({ variables: { code: values.code } });
      onEnrolled(data?.confirmMfaEnrolment ?? []);
    } catch (err) {
      notify(errorMessage(err, t('That code was not accepted.')), 'error');
      methods.reset({ code: '' });
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1}>
          <Text size="sm" color="text.secondary">
            {t('Scan this with your authenticator app, then type the code it shows.')}
          </Text>
          {qr && (
            <Box
              component="img"
              src={qr}
              alt={t('QR code for your authenticator app')}
              sx={{ width: 180, height: 180, alignSelf: 'flex-start', borderRadius: 1 }}
            />
          )}
          {secret && (
            <Alert severity="info">
              {t('Cannot scan? Enter this key by hand: {secret}', { secret })}
            </Alert>
          )}
          <RhfTextField
            name="code"
            label={t('Code from the app')}
            autoComplete="one-time-code"
            inputMode="numeric"
          />
          <Flex direction="row" spacing={1}>
            <Button type="submit" variant="contained" disabled={methods.formState.isSubmitting}>
              {t('Turn on')}
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
