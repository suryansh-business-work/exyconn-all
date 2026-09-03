import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSendTestSlackMessageMutation } from '@exyconn/shell/graphql/generated';

const schema = z.object({
  channel: z.string().trim().min(1, 'Channel is required').max(80, 'Channel name is too long'),
});
type Values = z.infer<typeof schema>;

interface SendTestSlackFormProps {
  configId: string;
  configLabel: string;
  defaultChannel?: string;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to post a verification message through a Slack config. */
export function SendTestSlackForm({
  configId,
  configLabel,
  defaultChannel = '',
  onDone,
  onCancel,
}: Readonly<SendTestSlackFormProps>) {
  const notify = useNotify();
  const [sendTest] = useSendTestSlackMessageMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    values: { channel: defaultChannel },
  });

  const onSubmit = async ({ channel }: Values) => {
    try {
      await sendTest({ variables: { id: configId, channel } });
      notify(`Test message posted to ${channel}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Send failed', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send test"
    >
      <Text size="sm" color="text.secondary">
        Verify the &ldquo;{configLabel}&rdquo; bot token by posting a message. The bot must already
        be a member of the channel.
      </Text>
      <RhfTextField name="channel" label="Channel" />
    </EntityForm>
  );
}
