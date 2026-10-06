import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  GatewayMode,
  useCreatePaypalConfigMutation,
  useUpdatePaypalConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { PaypalConfigRow } from './paypal-config.types';
import { KEEP_SECRET_HINT, secretField } from '../../secret';
import { BOOL_OPTIONS, MODE_OPTIONS } from '../../gatewayOptions';

/** PayPal client ids and secrets are long random strings; anything this short is a paste error. */
const MIN_KEY_LENGTH = 20;

const makeSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required').max(80, 'Keep the label short'),
    clientId: z
      .string()
      .trim()
      .min(1, 'Client id is required')
      .min(MIN_KEY_LENGTH, `Client id must be at least ${MIN_KEY_LENGTH} characters`),
    clientSecret: secretField(isEdit, 'Client secret is required', {
      test: (value) => value.length >= MIN_KEY_LENGTH,
      message: `Client secret must be at least ${MIN_KEY_LENGTH} characters`,
    }),
    webhookId: z.string().trim().min(1, 'Webhook id is required').max(80, 'Check the webhook id'),
    mode: z.nativeEnum(GatewayMode),
    isActive: z.enum(['true', 'false']),
  });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

const toInput = (values: Values) => ({
  label: values.label,
  clientId: values.clientId,
  clientSecret: values.clientSecret,
  webhookId: values.webhookId,
  mode: values.mode,
  isActive: values.isActive === 'true',
});

const toInitial = (row: PaypalConfigRow | null): Values => ({
  label: row?.label ?? '',
  clientId: row?.clientId ?? '',
  clientSecret: '',
  webhookId: row?.webhookId ?? '',
  mode: row?.mode ?? GatewayMode.Sandbox,
  isActive: row && !row.isActive ? 'false' : 'true',
});

interface PaypalConfigFormProps {
  initial: PaypalConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for Exyconn's PayPal account (client hub PayPal payments). */
export function PaypalConfigForm({ initial, onDone, onCancel }: Readonly<PaypalConfigFormProps>) {
  const [createConfig] = useCreatePaypalConfigMutation();
  const [updateConfig] = useUpdatePaypalConfigMutation();
  const methods = useForm<z.input<Schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(makeSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'PayPal account',
    initial,
    create: (values: Values) => createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfTextField
        name="clientId"
        label="Client id"
        helperText="PayPal Developer › Apps & Credentials › your app"
      />
      <RhfTextField
        name="clientSecret"
        label="Client secret"
        type="password"
        helperText={isEdit ? KEEP_SECRET_HINT : 'Shown under the client id in the same app'}
      />
      <RhfTextField
        name="webhookId"
        label="Webhook id"
        helperText="Add the webhook URL shown on the PayPal tab to the app, then copy its id"
      />
      <RhfSelect
        name="mode"
        label="Mode"
        options={MODE_OPTIONS}
        helperText="Sandbox and live apps have different credentials"
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
