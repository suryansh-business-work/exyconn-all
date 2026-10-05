import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '@exyconn/regex';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateStripeConfigMutation,
  useUpdateStripeConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { StripeConfigRow } from './stripe-config.types';
import { KEEP_SECRET_HINT, secretField, webhookUrl } from '../../secret';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const makeSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required').max(80, 'Keep the label short'),
    secretKey: secretField(isEdit, 'Secret key is required', {
      test: (value) => STRIPE_SECRET_KEY.test(value),
      message: 'A Stripe secret key starts with sk_live_ or sk_test_ (or rk_ for a restricted key)',
    }),
    webhookSecret: secretField(isEdit, 'Webhook signing secret is required', {
      test: (value) => STRIPE_WEBHOOK_SECRET.test(value),
      message: 'A Stripe webhook signing secret starts with whsec_',
    }),
    isActive: z.enum(['true', 'false']),
  });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

const toInput = (values: Values) => ({
  label: values.label,
  secretKey: values.secretKey,
  webhookSecret: values.webhookSecret,
  isActive: values.isActive === 'true',
});

const toInitial = (row: StripeConfigRow | null): Values => ({
  label: row?.label ?? '',
  secretKey: '',
  webhookSecret: '',
  isActive: row && !row.isActive ? 'false' : 'true',
});

interface StripeConfigFormProps {
  initial: StripeConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for Exyconn's Stripe account (client hub card payments). */
export function StripeConfigForm({ initial, onDone, onCancel }: Readonly<StripeConfigFormProps>) {
  const [createConfig] = useCreateStripeConfigMutation();
  const [updateConfig] = useUpdateStripeConfigMutation();
  const methods = useForm<z.input<Schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(makeSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Stripe account',
    initial,
    create: (values: Values) => createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfTextField
        name="secretKey"
        label="Secret key"
        type="password"
        helperText={isEdit ? KEEP_SECRET_HINT : 'Dashboard › Developers › API keys'}
      />
      <RhfTextField
        name="webhookSecret"
        label="Webhook signing secret"
        type="password"
        helperText={
          isEdit
            ? KEEP_SECRET_HINT
            : `Add the endpoint ${webhookUrl('/webhooks/stripe')} (checkout.session.* events), then copy its signing secret`
        }
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
