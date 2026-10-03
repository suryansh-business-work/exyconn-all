import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateGodaddyConfigMutation,
  useUpdateGodaddyConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { GodaddyConfigRow } from './godaddy-config.types';
import { KEEP_SECRET_HINT, secretField } from '../../secret';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** GoDaddy's keys and secrets are long random strings; anything this short is a paste error. */
const MIN_LENGTH = 16;
const longEnough = (what: string) => ({
  test: (value: string) => value.length >= MIN_LENGTH,
  message: `${what} must be at least ${MIN_LENGTH} characters`,
});

/** Both halves of the credential are write-only: required to create, blank on an edit keeps them. */
const makeSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required'),
    apiKey: secretField(isEdit, 'API key is required', longEnough('API key')),
    apiSecret: secretField(isEdit, 'API secret is required', longEnough('API secret')),
    isActive: z.enum(['true', 'false']),
  });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

const toInput = (values: Values) => ({
  label: values.label,
  apiKey: values.apiKey,
  apiSecret: values.apiSecret,
  isActive: values.isActive === 'true',
});

const toInitial = (row: GodaddyConfigRow | null): Values => ({
  label: row?.label ?? '',
  apiKey: '',
  apiSecret: '',
  // A new credential starts active; an existing one keeps its state.
  isActive: row && !row.isActive ? 'false' : 'true',
});

interface GodaddyConfigFormProps {
  initial: GodaddyConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for the GoDaddy API key and secret. */
export function GodaddyConfigForm({ initial, onDone, onCancel }: Readonly<GodaddyConfigFormProps>) {
  const [createConfig] = useCreateGodaddyConfigMutation();
  const [updateConfig] = useUpdateGodaddyConfigMutation();
  const methods = useForm<z.input<Schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(makeSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'GoDaddy config',
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
        helperText={isEdit ? KEEP_SECRET_HINT : 'A Production key from developer.godaddy.com/keys'}
      />
      <RhfTextField
        name="apiSecret"
        label="API secret"
        type="password"
        helperText={
          isEdit ? KEEP_SECRET_HINT : 'Shown once, next to the key, when GoDaddy creates it'
        }
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
