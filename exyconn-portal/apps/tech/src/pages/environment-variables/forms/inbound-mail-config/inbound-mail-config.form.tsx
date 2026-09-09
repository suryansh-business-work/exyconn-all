import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateInboundMailConfigMutation,
  useUpdateInboundMailConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { InboundMailConfigRow } from './inbound-mail-config.types';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** Reading more often than every half-minute only makes the mail server say no. */
const MIN_POLL_SECONDS = 30;
const MAX_POLL_SECONDS = 3600;
const MAX_PORT = 65535;

/**
 * The password is the one field an edit may leave empty: it is never sent to the browser,
 * so blank means "keep the stored one" — but a mailbox has to be created with one.
 */
const makeSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required'),
    host: z.string().trim().min(1, 'IMAP host is required'),
    port: z.coerce
      .number({ message: 'Port must be a number' })
      .min(1, 'Enter a valid port')
      .max(MAX_PORT, 'Enter a valid port'),
    secure: z.enum(['true', 'false']),
    user: z.string().trim().min(1, 'Username is required'),
    password: isEdit ? z.string() : z.string().min(1, 'Password is required'),
    mailbox: z.string().trim().min(1, 'Mailbox is required'),
    pollSeconds: z.coerce
      .number({ message: 'Interval must be a number' })
      .min(MIN_POLL_SECONDS, `Read the mailbox at most every ${MIN_POLL_SECONDS} seconds`)
      .max(MAX_POLL_SECONDS, `Read the mailbox at least every ${MAX_POLL_SECONDS} seconds`),
    deleteAfterImport: z.enum(['true', 'false']),
    isActive: z.enum(['true', 'false']),
  });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  label: values.label,
  host: values.host,
  port: values.port,
  secure: values.secure === 'true',
  user: values.user,
  password: values.password,
  mailbox: values.mailbox,
  pollSeconds: values.pollSeconds,
  deleteAfterImport: values.deleteAfterImport === 'true',
  isActive: values.isActive === 'true',
});

const toInitial = (row: InboundMailConfigRow | null): Values => ({
  label: row?.label ?? '',
  host: row?.host ?? '',
  port: row?.port ?? 993,
  secure: row?.secure === false ? 'false' : 'true',
  user: row?.user ?? '',
  // Never prefilled: the password is write-only, and an empty one keeps what is stored.
  password: '',
  mailbox: row?.mailbox ?? 'INBOX',
  pollSeconds: row?.pollSeconds ?? 120,
  deleteAfterImport: row?.deleteAfterImport ? 'true' : 'false',
  isActive: row?.isActive === false ? 'false' : 'true',
});

interface InboundMailConfigFormProps {
  initial: InboundMailConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for the mailbox the support desk reads. */
export function InboundMailConfigForm({
  initial,
  onDone,
  onCancel,
}: Readonly<InboundMailConfigFormProps>) {
  const [createConfig] = useCreateInboundMailConfigMutation();
  const [updateConfig] = useUpdateInboundMailConfigMutation();
  const methods = useForm<z.input<Schema>, unknown, Values>({
    resolver: zodResolver(makeSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Inbound mail config',
    initial,
    create: (values: Values) => createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  const passwordHint = isEdit
    ? 'Leave empty to keep the stored password'
    : 'Stored write-only — it is never shown again';

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfTextField name="host" label="IMAP host" helperText="For example imap.gmail.com" />
      <RhfTextField name="port" label="Port" type="number" />
      <RhfSelect name="secure" label="Use TLS/SSL (secure)" options={BOOL_OPTIONS} />
      <RhfTextField name="user" label="Username" />
      <RhfTextField name="password" label="Password" type="password" helperText={passwordHint} />
      <RhfTextField name="mailbox" label="Mailbox" helperText="The folder to read, e.g. INBOX" />
      <RhfTextField
        name="pollSeconds"
        label="Read every (seconds)"
        type="number"
        helperText="How long the importer waits between rounds"
      />
      <RhfSelect
        name="deleteAfterImport"
        label="Delete after import"
        options={BOOL_OPTIONS}
        helperText="Off keeps the message in the mailbox, marked as read"
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
