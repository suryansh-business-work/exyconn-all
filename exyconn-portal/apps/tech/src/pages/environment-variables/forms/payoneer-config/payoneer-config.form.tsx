import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  GatewayMode,
  useCreatePayoneerConfigMutation,
  useUpdatePayoneerConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { PayoneerConfigRow } from './payoneer-config.types';
import { KEEP_SECRET_HINT, secretField } from '../../secret';
import { BOOL_OPTIONS, MODE_OPTIONS } from '../../gatewayOptions';

/** Payoneer API tokens are long random strings; anything this short is a paste error. */
const MIN_TOKEN_LENGTH = 12;

const makeSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required').max(80, 'Keep the label short'),
    merchantCode: z
      .string()
      .trim()
      .min(1, 'Merchant code is required')
      .max(80, 'Check the merchant code'),
    apiToken: secretField(isEdit, 'API token is required', {
      test: (value) => value.length >= MIN_TOKEN_LENGTH,
      message: `API token must be at least ${MIN_TOKEN_LENGTH} characters`,
    }),
    division: z.string().trim().max(80, 'Check the division'),
    mode: z.nativeEnum(GatewayMode),
    isActive: z.enum(['true', 'false']),
  });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

const toInput = (values: Values) => ({
  label: values.label,
  merchantCode: values.merchantCode,
  apiToken: values.apiToken,
  division: values.division,
  mode: values.mode,
  isActive: values.isActive === 'true',
});

const toInitial = (row: PayoneerConfigRow | null): Values => ({
  label: row?.label ?? '',
  merchantCode: row?.merchantCode ?? '',
  apiToken: '',
  division: row?.division ?? '',
  mode: row?.mode ?? GatewayMode.Sandbox,
  isActive: row && !row.isActive ? 'false' : 'true',
});

interface PayoneerConfigFormProps {
  initial: PayoneerConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for Exyconn's Payoneer Checkout account (client hub payments). */
export function PayoneerConfigForm({
  initial,
  onDone,
  onCancel,
}: Readonly<PayoneerConfigFormProps>) {
  const [createConfig] = useCreatePayoneerConfigMutation();
  const [updateConfig] = useUpdatePayoneerConfigMutation();
  const methods = useForm<z.input<Schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(makeSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Payoneer account',
    initial,
    create: (values: Values) => createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfTextField
        name="merchantCode"
        label="Merchant code"
        helperText="Payoneer Checkout › Developers › API credentials"
      />
      <RhfTextField
        name="apiToken"
        label="API token"
        type="password"
        helperText={isEdit ? KEEP_SECRET_HINT : 'Shown once, when the token is generated'}
      />
      <RhfTextField
        name="division"
        label="Division"
        helperText="Optional — only for an account split into divisions"
      />
      <RhfSelect
        name="mode"
        label="Mode"
        options={MODE_OPTIONS}
        helperText="Sandbox and live accounts have different credentials"
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
