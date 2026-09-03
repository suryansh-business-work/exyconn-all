import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfMultiSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSaveTrackerBuildSettingsMutation } from '@exyconn/shell/graphql/generated';

const schema = z.object({
  slackChannels: z.array(z.string()),
});
type Values = z.infer<typeof schema>;

interface TrackerNotificationsFormProps {
  options: SelectOption[];
  initial: string[];
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form choosing which Slack channels a finished tracker
 * build is posted to. Saving no channels is allowed and means the build still
 * publishes its release, it just goes unannounced.
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
    values: { slackChannels: initial },
  });

  const onSubmit = async ({ slackChannels }: Values) => {
    try {
      await saveSettings({ variables: { slackChannels } });
      notify(
        slackChannels.length
          ? `Builds will be posted to ${slackChannels.length} channel(s)`
          : 'Builds will not be announced on Slack',
      );
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
    </EntityForm>
  );
}
