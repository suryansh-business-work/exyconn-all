import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Flex, Text } from '@exyconn/shell/components/ui';
import { RhfMultiSelect } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useListClientsQuery, useSendCampaignMutation } from '@exyconn/shell/graphql/generated';
import type { SendCampaignTarget } from './send-campaign.types';

const schema = z.object({
  clientIds: z.array(z.string()).min(1, 'Select at least one client'),
});
type Values = z.infer<typeof schema>;

interface SendCampaignFormProps {
  campaign: SendCampaignTarget;
  onDone: () => void;
  onCancel: () => void;
}

/** Emails a campaign's subject/body to the selected clients via the active SMTP config. */
export function SendCampaignForm({ campaign, onDone, onCancel }: SendCampaignFormProps) {
  const notify = useNotify();
  const { data } = useListClientsQuery();
  const [sendCampaign] = useSendCampaignMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { clientIds: [] },
  });

  const options = (data?.listClients ?? []).map((c) => ({
    value: c.id,
    label: `${c.name} · ${c.email}`,
  }));
  const ready = Boolean(campaign.subject && campaign.body);

  const onSubmit = async (values: Values) => {
    try {
      const res = await sendCampaign({
        variables: { id: campaign.id, clientIds: values.clientIds },
      });
      const r = res.data?.sendCampaign;
      notify(
        `Campaign sent to ${r?.sent ?? 0} client(s)${r?.failed ? ` · ${r.failed} failed` : ''}`,
      );
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Send failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <Text size="sm" color="text.secondary">
            Sending “{campaign.name}”{campaign.subject ? ` — “${campaign.subject}”` : ''}.
          </Text>
          {!ready && (
            <Alert severity="warning">
              Add an email subject and body to this campaign before sending.
            </Alert>
          )}
          <RhfMultiSelect
            name="clientIds"
            label="Recipients (clients)"
            options={options}
            helperText={options.length ? undefined : 'No clients found — add clients first.'}
          />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={false}
            onCancel={onCancel}
            submitLabel="Send"
          />
        </Flex>
      </form>
    </FormProvider>
  );
}
