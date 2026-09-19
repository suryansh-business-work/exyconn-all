import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Box, Link, Text } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useSaveSocialAppConfigMutation } from '@exyconn/shell/graphql/generated';
import { KEEP_SECRET_HINT } from '../../secret';
import type { SocialAppRow } from './social-app.types';

/** Turning an app on needs both halves of its credentials; a stored secret counts. */
const makeSchema = (hasSecret: boolean) =>
  z
    .object({
      clientId: z.string().trim().max(300, 'That is too long for a client ID'),
      clientSecret: z.string().trim().max(500, 'That is too long for a client secret'),
      enabled: z.boolean(),
    })
    .refine((v) => !v.enabled || v.clientId !== '', {
      path: ['clientId'],
      message: 'Add the client ID before turning the app on',
    })
    .refine((v) => !v.enabled || hasSecret || v.clientSecret !== '', {
      path: ['clientSecret'],
      message: 'Add the client secret before turning the app on',
    });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

interface SocialAppFormProps {
  row: SocialAppRow;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for one provider's OAuth app: client ID, secret, on or off. */
export function SocialAppForm({ row, onDone, onCancel }: Readonly<SocialAppFormProps>) {
  const t = useT();
  const [save] = useSaveSocialAppConfigMutation();
  const methods = useForm<z.input<Schema>, unknown, Values>({
    resolver: zodResolver(makeSchema(row.hasClientSecret)),
    // The secret is never prefilled: the API does not return it, and blank keeps it.
    defaultValues: { clientId: row.clientId, clientSecret: '', enabled: row.enabled },
  });
  const { onSubmit } = useEntitySave({
    label: '{app} app',
    labelValues: { app: row.label },
    initial: row,
    create: () => Promise.resolve(),
    update: (_row, values: Values) => save({ variables: { input: { app: row.app, ...values } } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit onCancel={onCancel} submitLabel="Save">
      <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
        <Text component="p" size="sm" weight="medium">
          {t('1. Create an app in the {provider} developer console.', { provider: row.label })}{' '}
          <Link href={row.consoleUrl} target="_blank" rel="noopener noreferrer">
            {t('Open the console')}
          </Link>
        </Text>
        <Text component="p" size="sm" weight="medium" sx={{ mt: 1 }}>
          {t('2. Register this exact redirect URL on it:')}
        </Text>
        <Text component="p" size="sm" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {row.callbackUrl}
        </Text>
        <Text component="p" size="sm" weight="medium" sx={{ mt: 1 }}>
          {t('3. Paste its client ID and secret below and turn it on.')}
        </Text>
      </Box>
      <RhfTextField name="clientId" label="Client ID" />
      <RhfTextField
        name="clientSecret"
        label="Client secret"
        type="password"
        helperText={row.hasClientSecret ? KEEP_SECRET_HINT : 'Shown once in the provider console.'}
      />
      <RhfSwitch name="enabled" label="Let Marketing connect accounts with this app" />
    </EntityForm>
  );
}
