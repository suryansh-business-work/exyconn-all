import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CLOUDFLARE_ID } from '@exyconn/regex';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateCloudflareConfigMutation,
  useUpdateCloudflareConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { CloudflareConfigRow } from './cloudflare-config.types';
import { KEEP_SECRET_HINT, secretField } from '../../secret';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** Cloudflare's API tokens are 40 characters; anything shorter is a paste error. */
const MIN_TOKEN_LENGTH = 40;

const makeSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required'),
    apiToken: secretField(isEdit, 'API token is required', {
      test: (value) => value.length >= MIN_TOKEN_LENGTH,
      message: `API token must be at least ${MIN_TOKEN_LENGTH} characters`,
    }),
    accountId: z
      .string()
      .trim()
      .min(1, 'Account ID is required')
      .regex(CLOUDFLARE_ID, 'Account ID is 32 letters and digits (a–f, 0–9)'),
    isActive: z.enum(['true', 'false']),
  });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

const toInput = (values: Values) => ({
  label: values.label,
  apiToken: values.apiToken,
  accountId: values.accountId,
  isActive: values.isActive === 'true',
});

const toInitial = (row: CloudflareConfigRow | null): Values => ({
  label: row?.label ?? '',
  apiToken: '',
  accountId: row?.accountId ?? '',
  // A new credential starts active; an existing one keeps its state.
  isActive: row && !row.isActive ? 'false' : 'true',
});

interface CloudflareConfigFormProps {
  initial: CloudflareConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for the Cloudflare API token and account. */
export function CloudflareConfigForm({
  initial,
  onDone,
  onCancel,
}: Readonly<CloudflareConfigFormProps>) {
  const [createConfig] = useCreateCloudflareConfigMutation();
  const [updateConfig] = useUpdateCloudflareConfigMutation();
  const methods = useForm<z.input<Schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(makeSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Cloudflare config',
    initial,
    create: (values: Values) => createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfTextField
        name="apiToken"
        label="API token"
        type="password"
        helperText={
          isEdit
            ? KEEP_SECRET_HINT
            : 'A token with Zone:Read, Zone:Edit and DNS:Edit, from dash.cloudflare.com/profile/api-tokens'
        }
      />
      <RhfTextField
        name="accountId"
        label="Account ID"
        helperText="On the Cloudflare dashboard's account home, under API — new zones are created here"
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
