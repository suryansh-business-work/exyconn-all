import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ONE_TIME_CODE } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import { Button, Flex, Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useRequestTechVaultCodeMutation,
  useUnlockTechVaultMutation,
} from '@exyconn/shell/graphql/generated';
import { browserLocation } from '../../browserLocation';
import type { UnlockVaultFormValues } from './unlock-vault.types';

const CODE_LENGTH = 6;
const REASON_MIN = 5;
const REASON_MAX = 300;

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Enter the code from the email')
    .regex(ONE_TIME_CODE, 'The code is 6 digits'),
  reason: z
    .string()
    .trim()
    .min(REASON_MIN, 'Say in a few words why you need the credentials')
    .max(REASON_MAX, 'Keep the reason under 300 characters'),
}) satisfies z.ZodType<UnlockVaultFormValues>;

type Values = z.infer<typeof schema>;

interface UnlockVaultFormProps {
  /** The address the code goes to: the one the person signs in with. */
  email: string;
  onUnlocked: () => void;
}

/**
 * Unlocking Environment Variables: a code emailed to the signed-in address, plus the reason,
 * opens them for 30 minutes. The device's location is asked for and recorded with the IP and
 * browser; refusing it is recorded too and does not block the unlock.
 */
export function UnlockVaultForm({ email, onUnlocked }: Readonly<UnlockVaultFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [sent, setSent] = useState(false);
  const [requestCode, { loading: sending }] = useRequestTechVaultCodeMutation();
  const [unlock] = useUnlockTechVaultMutation();
  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { code: '', reason: '' },
  });

  const send = async () => {
    try {
      await requestCode();
      setSent(true);
      notify('Code sent to {email}', 'success', { email });
    } catch (err) {
      notify(errorMessage(err, 'Could not send the code'), 'error');
    }
  };

  const onSubmit = async (values: Values) => {
    try {
      const location = await browserLocation();
      await unlock({ variables: { input: { ...values, location } } });
      notify('Environment Variables unlocked for 30 minutes', 'success');
      onUnlocked();
    } catch (err) {
      notify(errorMessage(err, 'Could not unlock'), 'error');
    }
  };

  const sendLabel = sent ? t('Send a new code') : t('Email me a code');

  return (
    <Flex direction="column" spacing={2}>
      <Text size="sm" color="text.secondary">
        {t('We email a 6-digit code to {email}. It works once and expires in 10 minutes.', {
          email,
        })}
      </Text>
      <Flex direction="row">
        <Button
          variant={sent ? 'text' : 'contained'}
          disabled={sending}
          onClick={() => {
            send().catch(() => setSent(false));
          }}
        >
          {sendLabel}
        </Button>
      </Flex>
      {sent && (
        <EntityForm
          methods={methods}
          onSubmit={onSubmit}
          isEdit
          onCancel={() => setSent(false)}
          submitLabel="Unlock"
        >
          <RhfTextField
            name="code"
            label="Code from the email"
            autoComplete="one-time-code"
            autoFocus
            helperText="Six digits."
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: CODE_LENGTH } }}
          />
          <RhfTextField
            name="reason"
            label="Why do you need the credentials?"
            multiline
            minRows={2}
            helperText="Kept in the access history with your IP address, browser and location, e.g. Rotating the SMTP password."
          />
        </EntityForm>
      )}
    </Flex>
  );
}
