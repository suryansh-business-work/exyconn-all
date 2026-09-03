import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
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

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  label: values.label,
  host: values.host,
  port: values.port,
  secure: values.secure === 'true',
  username: values.username,
  password: values.password,
  fromAddress: values.fromAddress,
  isActive: values.isActive === 'true',
});

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
  const [createConfig] = useCreateEmailConfigMutation();
  const [updateConfig] = useUpdateEmailConfigMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Email config',
    initial,
    create: (values: Values) => createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfTextField name="host" label="SMTP host" />
      <RhfTextField name="port" label="Port" type="number" />
      <RhfSelect name="secure" label="Use TLS/SSL (secure)" options={BOOL_OPTIONS} />
      <RhfTextField name="username" label="Username" />
      <RhfTextField name="password" label="Password" type="password" />
      <RhfTextField name="fromAddress" label="From address" />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
