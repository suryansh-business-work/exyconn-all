import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { RhfSecretField, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  CrmIntegrationStatusDocument,
  CrmSmsProvider,
  useCreateCrmSmsConfigMutation,
  useUpdateCrmSmsConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { ACTIVE_OPTIONS, KEEP_TOKEN_HINT } from '../secret';
import { RhfProviderSelect } from '../RhfProviderSelect';
import { Msg91SmsFields, TwilioSmsFields } from './crm-sms-config.fields';
import {
  makeCrmSmsConfigSchema,
  toCrmSmsConfigInput,
  toCrmSmsConfigValues,
  type CrmSmsConfigRow,
  type CrmSmsConfigSchema,
  type CrmSmsConfigValues,
} from './crm-sms-config.types';

const PROVIDERS = [CrmSmsProvider.Twilio, CrmSmsProvider.Msg91];

interface CrmSmsConfigFormProps {
  initial: CrmSmsConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for the company's SMS account (Twilio or MSG91). */
export function CrmSmsConfigForm({ initial, onDone, onCancel }: Readonly<CrmSmsConfigFormProps>) {
  const refetchQueries = [CrmIntegrationStatusDocument];
  const [createConfig] = useCreateCrmSmsConfigMutation({ refetchQueries });
  const [updateConfig] = useUpdateCrmSmsConfigMutation({ refetchQueries });
  const methods = useForm<z.input<CrmSmsConfigSchema>, unknown, CrmSmsConfigValues>({
    mode: 'onTouched',
    resolver: zodResolver(makeCrmSmsConfigSchema(Boolean(initial))),
    defaultValues: toCrmSmsConfigValues(initial),
  });
  const provider = useWatch({ control: methods.control, name: 'provider' });
  const isTwilio = provider === CrmSmsProvider.Twilio;
  const { isEdit, onSubmit } = useEntitySave({
    label: 'SMS account',
    initial,
    create: (values: CrmSmsConfigValues) =>
      createConfig({ variables: { input: toCrmSmsConfigInput(values) } }),
    update: (row, values) =>
      updateConfig({ variables: { id: row.id, input: toCrmSmsConfigInput(values) } }),
    onDone,
  });
  const tokenHelp = isTwilio
    ? 'Shown next to the Account SID in the Twilio console'
    : 'MSG91 > Settings > API keys';
  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" helperText="e.g. Sales texts" />
      <RhfProviderSelect providers={PROVIDERS} />
      {isTwilio ? <TwilioSmsFields /> : <Msg91SmsFields />}
      <RhfSecretField
        name="authToken"
        label={isTwilio ? 'Auth token' : 'Auth key'}
        stored={initial?.hasAuthToken}
        helperText={isEdit ? KEEP_TOKEN_HINT : tokenHelp}
      />
      <RhfSelect name="isActive" label="Set as active" options={ACTIVE_OPTIONS} />
    </EntityForm>
  );
}
