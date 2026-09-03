import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateSlackConfigMutation,
  useUpdateSlackConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { SlackConfigRow } from './slack-config.types';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const schema = z.object({
  label: z.string().trim().min(1, 'Label is required'),
  botToken: z
    .string()
    .trim()
    .min(1, 'Bot token is required')
    .startsWith('xoxb-', 'A Slack bot token starts with "xoxb-"'),
  defaultChannel: z
    .string()
    .trim()
    .min(1, 'Default channel is required')
    .max(80, 'Channel name is too long'),
  isActive: z.enum(['true', 'false']),
});
type Values = z.infer<typeof schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  label: values.label,
  botToken: values.botToken,
  defaultChannel: values.defaultChannel,
  isActive: values.isActive === 'true',
});

const toInitial = (row: SlackConfigRow | null): Values => ({
  label: row?.label ?? '',
  botToken: row?.botToken ?? '',
  defaultChannel: row?.defaultChannel ?? '',
  isActive: row ? (row.isActive ? 'true' : 'false') : 'true',
});

interface SlackConfigFormProps {
  initial: SlackConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a Slack workspace configuration. */
export function SlackConfigForm({ initial, onDone, onCancel }: Readonly<SlackConfigFormProps>) {
  const [createConfig] = useCreateSlackConfigMutation();
  const [updateConfig] = useUpdateSlackConfigMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Slack config',
    initial,
    create: (values: Values) => createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfTextField
        name="botToken"
        label="Bot token"
        type="password"
        helperText="Slack app bot token (xoxb-…) with the chat:write scope"
      />
      <RhfTextField
        name="defaultChannel"
        label="Default channel"
        helperText="Channel the bot posts to, e.g. #releases. Invite the bot to it first."
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
