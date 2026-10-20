import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { PreviewRecordKind, useSendCampaignTestMutation } from '@exyconn/shell/graphql/generated';
import { campaignTestSchema, type CampaignTestValues } from './campaign-test.types';

interface CampaignTestFormProps {
  campaignId: string;
  /** The record the test is personalised as; null uses sample data. */
  record: { kind: PreviewRecordKind; id: string; name: string } | null;
  /** Saves the draft first, so the test is of what is on screen. */
  beforeSend: () => Promise<unknown>;
}

/** Sends one [TEST] copy to a colleague's inbox. Its links never unsubscribe anybody. */
export function CampaignTestForm({
  campaignId,
  record,
  beforeSend,
}: Readonly<CampaignTestFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [sendTest] = useSendCampaignTestMutation();
  const methods = useForm<CampaignTestValues>({
    mode: 'onTouched',
    resolver: zodResolver(campaignTestSchema),
    defaultValues: { to: '' },
  });
  const submit = async (values: CampaignTestValues) => {
    try {
      await beforeSend();
      await sendTest({
        variables: {
          id: campaignId,
          to: values.to,
          recordKind: record?.kind ?? null,
          recordId: record?.id ?? null,
        },
      });
      notify('Test email sent to {email}', 'success', { email: values.to });
    } catch (err) {
      notify(errorMessage(err, 'The test email could not be sent'), 'error');
    }
  };
  return (
    <EntityForm
      methods={methods}
      onSubmit={submit}
      isEdit={false}
      onCancel={() => methods.reset()}
      submitLabel="Send test email"
    >
      <RhfTextField
        name="to"
        label="Send a test to"
        type="email"
        helperText="Only addresses of people with a portal account in your organization."
      />
      <Text size="caption" color="text.secondary">
        {record
          ? t(
              'Personalised as {name}. Marked [TEST]; no tracking; its links cannot unsubscribe anyone.',
              { name: record.name },
            )
          : t(
              'Personalised with sample data. Marked [TEST]; no tracking; its links cannot unsubscribe anyone.',
            )}
      </Text>
    </EntityForm>
  );
}
