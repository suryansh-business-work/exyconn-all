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
import { KEEP_SECRET_HINT, secretField } from '../../secret';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** Every Slack bot token starts with this; a user token (xoxp-) cannot post as the app. */
const BOT_TOKEN_PREFIX = 'xoxb-';

/** The secret is write-only: required to create, blank on an edit keeps the stored one. */
const makeSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required'),
    botToken: secretField(isEdit, 'Bot token is required', {
      test: (value) => value.startsWith(BOT_TOKEN_PREFIX),
      message: `A Slack bot token starts with "${BOT_TOKEN_PREFIX}"`,
    }),
    // Optional on create and edit alike; blank on an edit keeps the stored one.
    signingSecret: z.string().trim(),
    defaultChannel: z
      .string()
      .trim()
      .min(1, 'Default channel is required')
      .max(80, 'Channel name is too long'),
    isActive: z.enum(['true', 'false']),
  });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  label: values.label,
  botToken: values.botToken,
  // Sent only when typed, so a blank field never replaces the stored secret.
  signingSecret: values.signingSecret || undefined,
  defaultChannel: values.defaultChannel,
  isActive: values.isActive === 'true',
});

/** Optional either way; on an edit, says whether one is stored and that blank keeps it. */
const signingSecretHint = (row: SlackConfigRow | null): string => {
  if (!row) {
    return 'Optional. Lets website chat agents reply from Slack threads.';
  }
  return row.hasSigningSecret
    ? 'Signing secret stored. Optional; lets website chat agents reply from Slack threads. Leave empty to keep the stored one.'
    : 'Optional. Lets website chat agents reply from Slack threads. No signing secret stored yet.';
};

const toInitial = (row: SlackConfigRow | null): Values => ({
  label: row?.label ?? '',
  // Never prefilled: the API does not return it, and blank keeps the stored token.
  botToken: '',
  signingSecret: '',
  defaultChannel: row?.defaultChannel ?? '',
  isActive: row?.isActive === false ? 'false' : 'true',
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
  const methods = useForm<z.input<Schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(makeSchema(Boolean(initial))),
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
        helperText={
          isEdit ? KEEP_SECRET_HINT : 'Slack app bot token (xoxb-…) with the chat:write scope'
        }
      />
      <RhfTextField
        name="signingSecret"
        label="Signing secret"
        type="password"
        helperText={signingSecretHint(initial)}
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
