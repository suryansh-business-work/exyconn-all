import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import type { z } from 'zod';
import {
  RhfSecretField,
  RhfSelect,
  RhfTextField,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  BillingProvider,
  TechSecret,
  useCreateBillingKeyConfigMutation,
  useUpdateBillingKeyConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { KEEP_SECRET_HINT } from '@exyconn/shell/utils/secret';
import { useTechSecretReveal } from '../../useTechSecretReveal';
import {
  makeBillingKeyConfigSchema,
  type BillingKeyConfigRow,
  type BillingKeyConfigSchema,
  type BillingKeyConfigValues,
} from './billing-key-config.types';

const PROVIDER_OPTIONS: SelectOption[] = [{ value: BillingProvider.Openai, label: 'OpenAI' }];

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const toInput = ({ isActive, ...values }: BillingKeyConfigValues) => ({
  ...values,
  isActive: isActive === 'true',
});

const toInitial = (row: BillingKeyConfigRow | null): BillingKeyConfigValues => ({
  provider: row?.provider ?? BillingProvider.Openai,
  label: row?.label ?? '',
  // Never prefilled: the API does not return it, and blank keeps the stored key.
  key: '',
  isActive: row?.isActive === false ? 'false' : 'true',
});

interface BillingKeyConfigFormProps {
  initial: BillingKeyConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for a billing key: the extra key that reads a provider's real bill
 * (OpenAI's Admin key for its Costs API), kept apart from the key the platform calls it with.
 */
export function BillingKeyConfigForm({
  initial,
  onDone,
  onCancel,
}: Readonly<BillingKeyConfigFormProps>) {
  const [createConfig] = useCreateBillingKeyConfigMutation();
  const [updateConfig] = useUpdateBillingKeyConfigMutation();
  const revealFor = useTechSecretReveal(initial?.id);
  const methods = useForm<z.input<BillingKeyConfigSchema>, unknown, BillingKeyConfigValues>({
    mode: 'onTouched',
    resolver: zodResolver(makeBillingKeyConfigSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Billing key',
    initial,
    create: (values: BillingKeyConfigValues) =>
      createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });
  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfSelect
        name="provider"
        label="Provider"
        options={PROVIDER_OPTIONS}
        helperText="Whose bill this key reads."
      />
      <RhfTextField
        name="label"
        label="Label"
        helperText="A name to tell keys apart, e.g. Billing (read only)."
      />
      <RhfSecretField
        name="key"
        label="Billing key"
        stored={initial?.hasKey}
        onReveal={revealFor(TechSecret.BillingKey)}
        helperText={
          isEdit
            ? KEEP_SECRET_HINT
            : 'An OpenAI Admin key from platform.openai.com/settings/organization/admin-keys'
        }
      />
      <RhfSelect
        name="isActive"
        label="Set as active"
        options={BOOL_OPTIONS}
        helperText="Only one key per provider is active; the dashboards read the bill with it."
      />
    </EntityForm>
  );
}
