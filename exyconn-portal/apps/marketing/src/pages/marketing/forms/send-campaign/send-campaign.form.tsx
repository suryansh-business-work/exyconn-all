import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Text } from '@exyconn/shell/components/ui';
import { RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useListAudienceListsQuery,
  useSendCampaignMutation,
} from '@exyconn/shell/graphql/generated';
import type { SendCampaignTarget } from './send-campaign.types';

const schema = z.object({
  audienceListId: z.string().min(1, 'Choose the audience to send to'),
});
type Values = z.infer<typeof schema>;

interface SendCampaignFormProps {
  campaign: SendCampaignTarget;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Emails a campaign's subject/body to a saved audience via the active SMTP config.
 * Recipients come from an audience rather than a hand-picked list so the same send can
 * be repeated, and so who was written to is answerable afterwards.
 */
export function SendCampaignForm({ campaign, onDone, onCancel }: Readonly<SendCampaignFormProps>) {
  const notify = useNotify();
  const { data } = useListAudienceListsQuery();
  const [sendCampaign] = useSendCampaignMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { audienceListId: '' },
  });

  const options: SelectOption[] = (data?.listAudienceLists ?? []).map((audience) => ({
    value: audience.id,
    label: `${audience.name} · ${audience.clientIds.length} client(s)`,
  }));
  const ready = Boolean(campaign.subject && campaign.body);

  const onSubmit = async (values: Values) => {
    try {
      const res = await sendCampaign({
        variables: { id: campaign.id, audienceListId: values.audienceListId },
      });
      const result = res.data?.sendCampaign;
      const failed = result?.failed ? ` · ${result.failed} failed` : '';
      notify(`Campaign sent to ${result?.sent ?? 0} client(s)${failed}`);
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'Send failed'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send"
    >
      <Text size="sm" color="text.secondary">
        Sending “{campaign.name}”{campaign.subject ? ` — “${campaign.subject}”` : ''}.
      </Text>
      {!ready && (
        <Alert severity="warning">
          Add an email subject and body to this campaign before sending.
        </Alert>
      )}
      <RhfSelect
        name="audienceListId"
        label="Audience"
        options={options}
        helperText={options.length ? undefined : 'No audiences yet — create one first.'}
      />
    </EntityForm>
  );
}
