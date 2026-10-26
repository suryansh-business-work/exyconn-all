import { useApolloClient } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { RhfSecretField, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  ProviderSignInMethod,
  TechProviderLoginPasswordDocument,
  useSaveTechProviderLoginMutation,
  type TechProviderLoginPasswordQuery,
} from '@exyconn/shell/graphql/generated';
import type { ProviderLoginFormValues, ProviderLoginRow } from './provider-login.types';

const SIGN_IN_OPTIONS = [
  { value: ProviderSignInMethod.EmailPassword, label: 'Email and password' },
  { value: ProviderSignInMethod.Google, label: 'Sign in with Google' },
  { value: ProviderSignInMethod.Github, label: 'Sign in with GitHub' },
  { value: ProviderSignInMethod.Microsoft, label: 'Sign in with Microsoft' },
  { value: ProviderSignInMethod.Apple, label: 'Sign in with Apple' },
  { value: ProviderSignInMethod.Sso, label: 'Company single sign-on (SSO)' },
  { value: ProviderSignInMethod.Other, label: 'Other' },
];

const schema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Name the account')
    .max(120, 'Keep the name under 120 characters'),
  username: z.string().trim().max(200, 'Keep it under 200 characters'),
  signInMethod: z.enum(ProviderSignInMethod),
  password: z.string().max(500, 'Keep the password under 500 characters'),
  notes: z.string().trim().max(2000, 'Keep the notes under 2000 characters'),
}) satisfies z.ZodType<ProviderLoginFormValues>;

type Values = z.infer<typeof schema>;

interface ProviderLoginFormProps {
  provider: string;
  initial: ProviderLoginRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * The account a provider's keys were created under: how to sign in to its console. The password
 * is sealed on the server; the eye fetches it (logged), and leaving it blank keeps it.
 */
export function ProviderLoginForm({
  provider,
  initial,
  onDone,
  onCancel,
}: Readonly<ProviderLoginFormProps>) {
  const notify = useNotify();
  const client = useApolloClient();
  const [save] = useSaveTechProviderLoginMutation({ refetchQueries: ['TechProviderProfile'] });
  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: {
      label: initial?.label ?? '',
      username: initial?.username ?? '',
      signInMethod: initial?.signInMethod ?? ProviderSignInMethod.EmailPassword,
      password: '',
      notes: initial?.notes ?? '',
    },
  });

  const reveal = async () => {
    const { data } = await client.query<TechProviderLoginPasswordQuery>({
      query: TechProviderLoginPasswordDocument,
      variables: { provider, id: initial?.id ?? '' },
      fetchPolicy: 'no-cache',
    });
    return data?.techProviderLoginPassword ?? '';
  };

  const onSubmit = async (input: Values) => {
    try {
      await save({ variables: { provider, id: initial?.id ?? null, input } });
      notify(initial ? 'Account updated' : 'Account added');
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'Could not save the account'), 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={Boolean(initial)} onCancel={onCancel}>
      <RhfTextField
        name="label"
        label="Account name"
        helperText="Who or what this login is, e.g. Owner account or Billing admin."
      />
      <RhfSelect
        name="signInMethod"
        label="How you sign in"
        options={SIGN_IN_OPTIONS}
        helperText="With Google, GitHub or SSO there is no password to keep — note the address used."
      />
      <RhfTextField
        name="username"
        label="Email or username"
        autoComplete="off"
        helperText="The address or username used to sign in to the provider’s console."
      />
      <RhfSecretField
        name="password"
        label="Password"
        stored={Boolean(initial?.hasPassword)}
        onReveal={initial?.hasPassword ? reveal : undefined}
        helperText="Optional. Sealed on the server; every look is logged. Leave blank to keep the saved one."
      />
      <RhfTextField
        name="notes"
        label="Notes"
        multiline
        minRows={2}
        helperText="Optional. Where 2-step codes go, who owns the account, recovery details."
      />
    </EntityForm>
  );
}
