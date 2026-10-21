import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import type { z } from 'zod';
import { RhfSecretField, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  CrmCallProvider,
  CrmIntegrationStatusDocument,
  useCreateCrmCallConfigMutation,
  useUpdateCrmCallConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { ACTIVE_OPTIONS, KEEP_TOKEN_HINT } from '../secret';
import { RhfProviderSelect } from '../RhfProviderSelect';
import {
  accountLabel,
  makeCrmCallConfigSchema,
  toCrmCallConfigInput,
  toCrmCallConfigValues,
  type CrmCallConfigRow,
  type CrmCallConfigSchema,
  type CrmCallConfigValues,
} from './crm-call-config.types';

const PROVIDERS = [CrmCallProvider.Twilio, CrmCallProvider.Vobiz];

interface CrmCallConfigFormProps {
  initial: CrmCallConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for the company's calling account (Twilio or Vobiz). */
export function CrmCallConfigForm({ initial, onDone, onCancel }: Readonly<CrmCallConfigFormProps>) {
  const refetchQueries = [CrmIntegrationStatusDocument];
  const [createConfig] = useCreateCrmCallConfigMutation({ refetchQueries });
  const [updateConfig] = useUpdateCrmCallConfigMutation({ refetchQueries });
  const methods = useForm<z.input<CrmCallConfigSchema>, unknown, CrmCallConfigValues>({
    mode: 'onTouched',
    resolver: zodResolver(makeCrmCallConfigSchema(Boolean(initial))),
    defaultValues: toCrmCallConfigValues(initial),
  });
  const provider = useWatch({ control: methods.control, name: 'provider' });
  const isTwilio = provider === CrmCallProvider.Twilio;
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Call account',
    initial,
    create: (values: CrmCallConfigValues) =>
      createConfig({ variables: { input: toCrmCallConfigInput(values) } }),
    update: (row, values) =>
      updateConfig({ variables: { id: row.id, input: toCrmCallConfigInput(values) } }),
    onDone,
  });
  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" helperText="e.g. Sales line" />
      <RhfProviderSelect providers={PROVIDERS} />
      <RhfTextField
        name="accountId"
        label={accountLabel(provider)}
        helperText={
          isTwilio
            ? 'Twilio console > Account info: starts with AC'
            : 'Vobiz console > API credentials'
        }
      />
      <RhfSecretField
        name="authToken"
        label="Auth token"
        stored={initial?.hasAuthToken}
        helperText={isEdit ? KEEP_TOKEN_HINT : 'Shown next to the account id in the console'}
      />
      <RhfTextField
        name="fromNumber"
        label="From number"
        inputMode="tel"
        helperText="A number on this account, in international format, e.g. +14155550100. It is the caller id people see."
      />
      <RhfSelect name="isActive" label="Set as active" options={ACTIVE_OPTIONS} />
    </EntityForm>
  );
}
