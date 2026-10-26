import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { RhfSecretField, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useSaveLeadSourceConfigMutation,
  type LeadSourceConfigQuery,
} from '@exyconn/shell/graphql/generated';
import type { ApifySettingsFormValues } from './apify-settings.types';

const schema = z.object({
  apifyToken: z.string().trim().max(300, 'That is too long to be an Apify API token'),
  clutchActorId: z
    .string()
    .trim()
    .min(1, 'Enter the Apify actor')
    .max(120, 'Keep it under 120 characters'),
}) satisfies z.ZodType<ApifySettingsFormValues>;

type Values = z.infer<typeof schema>;
type Settings = LeadSourceConfigQuery['leadSourceConfig'];

interface ApifySettingsFormProps {
  settings: Settings;
  onDone: () => void;
  onCancel: () => void;
}

/** The Apify API token (sealed on the server) and which Clutch actor to run. */
export function ApifySettingsForm({
  settings,
  onDone,
  onCancel,
}: Readonly<ApifySettingsFormProps>) {
  const notify = useNotify();
  const [save] = useSaveLeadSourceConfigMutation({ refetchQueries: ['LeadSourceConfig'] });
  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { apifyToken: '', clutchActorId: settings.clutchActorId },
  });

  const onSubmit = async (input: Values) => {
    try {
      await save({ variables: { input } });
      notify('Apify settings saved');
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'Could not save the Apify settings'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={settings.hasApifyToken}
      onCancel={onCancel}
    >
      <RhfSecretField
        name="apifyToken"
        label="Apify API token"
        stored={settings.hasApifyToken}
        helperText="From console.apify.com > Settings > API & Integrations. Sealed on the server; leave blank to keep the saved one."
      />
      <RhfTextField
        name="clutchActorId"
        label="Clutch actor"
        helperText="The Apify actor to run, e.g. scrapeai/clutch-co-scraper."
      />
    </EntityForm>
  );
}
