import { useForm } from 'react-hook-form';
import { zodResolver } from '@/components/form/zodResolver';
import { z } from 'zod';
import { ONE_TIME_CODE } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import { Text } from '@/components/ui';
import { RhfTextField } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useVerifyEmployeeEmailCodeMutation } from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import type { EmployeeEmailCodeFormValues, EmployeeEmailTarget } from './employee-email-code.types';

const CODE_LENGTH = 6;

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Enter the code from the email')
    .regex(ONE_TIME_CODE, 'The code is 6 digits'),
}) satisfies z.ZodType<EmployeeEmailCodeFormValues>;

type Values = z.infer<typeof schema>;

interface EmployeeEmailCodeFormProps extends EmployeeEmailTarget {
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Checks the code that was emailed to one of an employee's addresses. A right code marks the
 * address verified on the server; a wrong or expired one says so and leaves it unverified.
 */
export function EmployeeEmailCodeForm({
  employeeId,
  kind,
  address,
  onDone,
  onCancel,
}: Readonly<EmployeeEmailCodeFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [verify] = useVerifyEmployeeEmailCodeMutation();
  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  const onSubmit = async ({ code }: Values) => {
    try {
      await verify({ variables: { employeeId, kind, code } });
      notify('{address} is verified', 'success', { address });
      onDone();
    } catch (error) {
      portalLogger.warn('Verifying an employee email code failed', { kind });
      notify(error instanceof Error ? error.message : 'Could not verify the code', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Verify"
    >
      <Text size="sm" color="text.secondary">
        {t('A 6-digit code was emailed to {address}. Enter the code the employee received.', {
          address,
        })}
      </Text>
      <RhfTextField
        name="code"
        label="Verification code"
        autoComplete="one-time-code"
        autoFocus
        helperText="Codes expire. If it has, close this and send a new one."
        slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: CODE_LENGTH } }}
      />
    </EntityForm>
  );
}
