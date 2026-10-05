import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RAZORPAY_KEY_ID } from '@exyconn/regex';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateRazorpayConfigMutation,
  useUpdateRazorpayConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { RazorpayConfigRow } from './razorpay-config.types';
import { KEEP_SECRET_HINT, secretField, webhookUrl } from '../../secret';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** Razorpay secrets are long random strings; anything this short is a paste error. */
const MIN_SECRET_LENGTH = 12;

const makeSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required').max(80, 'Keep the label short'),
    keyId: z
      .string()
      .trim()
      .regex(RAZORPAY_KEY_ID, 'A Razorpay key id starts with rzp_live_ or rzp_test_'),
    keySecret: secretField(isEdit, 'Key secret is required', {
      test: (value) => value.length >= MIN_SECRET_LENGTH,
      message: `Key secret must be at least ${MIN_SECRET_LENGTH} characters`,
    }),
    webhookSecret: secretField(isEdit, 'Webhook secret is required', {
      test: (value) => value.length >= MIN_SECRET_LENGTH,
      message: `Webhook secret must be at least ${MIN_SECRET_LENGTH} characters`,
    }),
    isActive: z.enum(['true', 'false']),
  });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

const toInput = (values: Values) => ({
  label: values.label,
  keyId: values.keyId,
  keySecret: values.keySecret,
  webhookSecret: values.webhookSecret,
  isActive: values.isActive === 'true',
});

const toInitial = (row: RazorpayConfigRow | null): Values => ({
  label: row?.label ?? '',
  keyId: row?.keyId ?? '',
  keySecret: '',
  webhookSecret: '',
  isActive: row && !row.isActive ? 'false' : 'true',
});

interface RazorpayConfigFormProps {
  initial: RazorpayConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for Exyconn's Razorpay account (client hub UPI/card payments). */
export function RazorpayConfigForm({
  initial,
  onDone,
  onCancel,
}: Readonly<RazorpayConfigFormProps>) {
  const [createConfig] = useCreateRazorpayConfigMutation();
  const [updateConfig] = useUpdateRazorpayConfigMutation();
  const methods = useForm<z.input<Schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(makeSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Razorpay account',
    initial,
    create: (values: Values) => createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfTextField
        name="keyId"
        label="Key id"
        helperText="Dashboard › Account & Settings › API keys"
      />
      <RhfTextField
        name="keySecret"
        label="Key secret"
        type="password"
        helperText={isEdit ? KEEP_SECRET_HINT : 'Shown once, when the key is generated'}
      />
      <RhfTextField
        name="webhookSecret"
        label="Webhook secret"
        type="password"
        helperText={
          isEdit
            ? KEEP_SECRET_HINT
            : `Add the webhook ${webhookUrl('/webhooks/razorpay')} (payment_link.* events) with this secret`
        }
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
