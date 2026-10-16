import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import {
  RhfSecretField,
  RhfTextField,
  RhfSelect,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateEmailVerifierConfigMutation,
  useUpdateEmailVerifierConfigMutation,
  TechSecret,
} from '@exyconn/shell/graphql/generated';
import { KEEP_SECRET_HINT } from '../../secret';
import {
  emailVerifierConfigSchema,
  type EmailVerifierConfigRow,
  type EmailVerifierConfigValues,
} from './email-verifier-config.types';
import { useTechSecretReveal } from '../../useTechSecretReveal';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** SOCKS5's own port, the usual default of a proxy that speaks it. */
const SOCKS_PORT = 1080;

const toInput = ({ isActive, ...values }: EmailVerifierConfigValues) => ({
  ...values,
  isActive: isActive === 'true',
});

const toInitial = (
  row: EmailVerifierConfigRow | null,
): z.input<typeof emailVerifierConfigSchema> => ({
  label: row?.label ?? '',
  proxyHost: row?.proxyHost ?? '',
  proxyPort: row?.proxyPort ?? SOCKS_PORT,
  proxyUsername: row?.proxyUsername ?? '',
  // Never prefilled: the API does not return it, and blank keeps the stored password.
  proxyPassword: '',
  isActive: row?.isActive === false ? 'false' : 'true',
});

interface EmailVerifierConfigFormProps {
  initial: EmailVerifierConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for the SOCKS5 proxy the email verifier checks mailboxes through. */
export function EmailVerifierConfigForm({
  initial,
  onDone,
  onCancel,
}: Readonly<EmailVerifierConfigFormProps>) {
  const [createConfig] = useCreateEmailVerifierConfigMutation();
  const [updateConfig] = useUpdateEmailVerifierConfigMutation();
  const methods = useForm<
    z.input<typeof emailVerifierConfigSchema>,
    unknown,
    EmailVerifierConfigValues
  >({
    mode: 'onTouched',
    resolver: zodResolver(emailVerifierConfigSchema),
    defaultValues: toInitial(initial),
  });
  const revealFor = useTechSecretReveal(initial?.id);
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Email verifier config',
    initial,
    create: (values: EmailVerifierConfigValues) =>
      createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });
  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfTextField
        name="proxyHost"
        label="SOCKS5 proxy host"
        helperText="A proxy allowed to connect out on port 25. Leave empty to check without one."
      />
      <RhfTextField name="proxyPort" label="Proxy port" type="number" />
      <RhfTextField name="proxyUsername" label="Proxy username" />
      <RhfSecretField
        name="proxyPassword"
        label="Proxy password"
        stored={initial?.hasProxyPassword}
        onReveal={revealFor(TechSecret.EmailVerifierProxyPassword)}
        helperText={isEdit ? KEEP_SECRET_HINT : 'Only if the proxy asks for one'}
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
