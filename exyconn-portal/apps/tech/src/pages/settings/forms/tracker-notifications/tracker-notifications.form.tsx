import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfMultiSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSaveTrackerBuildSettingsMutation } from '@exyconn/shell/graphql/generated';
import type { TrackerNotificationsFormValues } from './tracker-notifications.types';

const schema = z.object({
  slackChannels: z.array(z.string()),
  statusAlertChannels: z.array(z.string()),
});
type Values = z.infer<typeof schema>;

interface TrackerNotificationsFormProps {
  options: SelectOption[];
  initial: TrackerNotificationsFormValues;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form choosing which Slack channels a finished tracker
 * build is posted to, and which ones hear when a status incident opens or
 * resolves. Saving no channels is allowed: the build still publishes its release
 * and the incident is still recorded, they just go unannounced on Slack.
 */
export function TrackerNotificationsForm({
  options,
  initial,
  onDone,
  onCancel,
}: Readonly<TrackerNotificationsFormProps>) {
  const notify = useNotify();
  const [saveSettings] = useSaveTrackerBuildSettingsMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    values: initial,
  });

  const onSubmit = async ({ slackChannels, statusAlertChannels }: Values) => {
    try {
      await saveSettings({ variables: { slackChannels, statusAlertChannels } });
      notify('Notification channels saved');
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Save channels"
    >
      <Text size="sm" color="text.secondary">
        Every channel the Slack bot can see is listed. It joins a public channel on its own; a
        private one marked &ldquo;needs /invite&rdquo; has to be joined by hand first.
      </Text>
      <RhfMultiSelect name="slackChannels" label="Channels for tracker builds" options={options} />
      <RhfMultiSelect name="statusAlertChannels" label="Status alerts" options={options} />
    </EntityForm>
  );
}
