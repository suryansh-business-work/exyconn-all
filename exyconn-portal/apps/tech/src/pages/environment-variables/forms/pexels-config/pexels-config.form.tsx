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
import { KEEP_SECRET_HINT, secretField } from '../../secret';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** Pexels issues a fixed-length alphanumeric key; anything shorter is a paste error. */
const MIN_KEY_LENGTH = 32;

/** The secret is write-only: required to create, blank on an edit keeps the stored one. */
const makeSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required'),
    apiKey: secretField(isEdit, 'API key is required', {
      test: (value) => value.length >= MIN_KEY_LENGTH,
      message: `API key must be at least ${MIN_KEY_LENGTH} characters`,
    }),
    isActive: z.enum(['true', 'false']),
  });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  label: values.label,
  apiKey: values.apiKey,
  isActive: values.isActive === 'true',
});

const toInitial = (row: PexelsConfigRow | null): Values => ({
  label: row?.label ?? '',
  // Never prefilled: the API does not return it, and blank keeps the stored key.
  apiKey: '',
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
  const methods = useForm<z.input<Schema>, unknown, Values>({
    resolver: zodResolver(makeSchema(Boolean(initial))),
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
        helperText={
          isEdit
            ? KEEP_SECRET_HINT
            : 'From pexels.com/api — one key covers both photo and video search'
        }
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
