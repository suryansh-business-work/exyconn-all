import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreatePexelsConfigMutation,
  useUpdatePexelsConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { PexelsConfigRow } from './pexels-config.types';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** Pexels issues a fixed-length alphanumeric key; anything shorter is a paste error. */
const MIN_KEY_LENGTH = 32;

const schema = z.object({
  label: z.string().trim().min(1, 'Label is required'),
  apiKey: z
    .string()
    .trim()
    .min(1, 'API key is required')
    .min(MIN_KEY_LENGTH, `API key must be at least ${MIN_KEY_LENGTH} characters`),
  isActive: z.enum(['true', 'false']),
});
type Values = z.infer<typeof schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  label: values.label,
  apiKey: values.apiKey,
  isActive: values.isActive === 'true',
});

const toInitial = (row: PexelsConfigRow | null): Values => ({
  label: row?.label ?? '',
  apiKey: row?.apiKey ?? '',
  isActive: row ? (row.isActive ? 'true' : 'false') : 'true',
});

interface PexelsConfigFormProps {
  initial: PexelsConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update the Pexels stock-media API key. */
export function PexelsConfigForm({ initial, onDone, onCancel }: Readonly<PexelsConfigFormProps>) {
  const [createConfig] = useCreatePexelsConfigMutation();
  const [updateConfig] = useUpdatePexelsConfigMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Pexels config',
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
        helperText="From pexels.com/api — one key covers both photo and video search"
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
