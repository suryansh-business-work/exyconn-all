import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useCreateEmailConfigMutation,
  useUpdateEmailConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { EmailConfigRow } from './email-config.types';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const schema = z.object({
  label: z.string().trim().min(1, 'Label is required'),
  host: z.string().trim().min(1, 'Host is required'),
  port: z.coerce
    .number({ message: 'Port must be a number' })
    .min(1, 'Enter a valid port')
    .max(65535, 'Enter a valid port'),
  secure: z.enum(['true', 'false']),
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  fromAddress: z.string().trim().min(1, 'From address is required'),
  isActive: z.enum(['true', 'false']),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: EmailConfigRow | null): Values => ({
  label: row?.label ?? '',
  host: row?.host ?? '',
  port: row?.port ?? 587,
  secure: row ? (row.secure ? 'true' : 'false') : 'false',
  username: row?.username ?? '',
  password: row?.password ?? '',
  fromAddress: row?.fromAddress ?? '',
  isActive: row ? (row.isActive ? 'true' : 'false') : 'true',
});

interface EmailConfigFormProps {
  initial: EmailConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an SMTP/email configuration. */
export function EmailConfigForm({ initial, onDone, onCancel }: EmailConfigFormProps) {
  const notify = useNotify();
  const [createConfig] = useCreateEmailConfigMutation();
  const [updateConfig] = useUpdateEmailConfigMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    const input = {
      label: values.label,
      host: values.host,
      port: values.port,
      secure: values.secure === 'true',
      username: values.username,
      password: values.password,
      fromAddress: values.fromAddress,
      isActive: values.isActive === 'true',
    };
    try {
      if (isEdit && initial) await updateConfig({ variables: { id: initial.id, input } });
      else await createConfig({ variables: { input } });
      notify(`Email config ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="label" label="Label" />
          <RhfTextField name="host" label="SMTP host" />
          <RhfTextField name="port" label="Port" type="number" />
          <RhfSelect name="secure" label="Use TLS/SSL (secure)" options={BOOL_OPTIONS} />
          <RhfTextField name="username" label="Username" />
          <RhfTextField name="password" label="Password" type="password" />
          <RhfTextField name="fromAddress" label="From address" />
          <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={isEdit}
            onCancel={onCancel}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}
