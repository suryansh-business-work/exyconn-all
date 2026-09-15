import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateOpenAiConfigMutation,
  useUpdateOpenAiConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { OpenAiConfigRow } from './openai-config.types';
import { KEEP_SECRET_HINT, secretField } from '../../secret';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** Every OpenAI secret key starts with this prefix; anything else is the wrong value. */
const KEY_PREFIX = 'sk-';

/** The secret is write-only: required to create, blank on an edit keeps the stored one. */
const makeSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required'),
    apiKey: secretField(isEdit, 'API key is required', {
      test: (value) => value.startsWith(KEY_PREFIX),
      message: `API key must start with "${KEY_PREFIX}"`,
    }),
    defaultModel: z.string().trim().min(1, 'Model is required'),
    isActive: z.enum(['true', 'false']),
  });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  label: values.label,
  apiKey: values.apiKey,
  defaultModel: values.defaultModel,
  isActive: values.isActive === 'true',
});

const toInitial = (row: OpenAiConfigRow | null): Values => ({
  label: row?.label ?? '',
  // Never prefilled: the API does not return it, and blank keeps the stored key.
  apiKey: '',
  defaultModel: row?.defaultModel ?? '',
  isActive: row ? (row.isActive ? 'true' : 'false') : 'true',
});

interface OpenAiConfigFormProps {
  initial: OpenAiConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update the OpenAI key and its model. */
export function OpenAiConfigForm({ initial, onDone, onCancel }: Readonly<OpenAiConfigFormProps>) {
  const [createConfig] = useCreateOpenAiConfigMutation();
  const [updateConfig] = useUpdateOpenAiConfigMutation();
  const methods = useForm<z.input<Schema>, unknown, Values>({
    resolver: zodResolver(makeSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'OpenAI config',
    initial,
    create: (values: Values) => createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfTextField
        name="apiKey"
        label="API key"
        type="password"
        helperText={isEdit ? KEEP_SECRET_HINT : 'A secret key from platform.openai.com/api-keys'}
      />
      <RhfTextField
        name="defaultModel"
        label="Model"
        helperText="The model requests default to, e.g. gpt-4o-mini. Tested against this key."
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
