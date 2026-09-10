import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Stack, Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useListAudienceListsQuery,
  useSendCampaignMutation,
} from '@exyconn/shell/graphql/generated';
import { SendPreview } from './SendPreview';
import type { SendCampaignTarget } from './send-campaign.types';

const schema = z.object({
  audienceListId: z.string().min(1, 'Choose the audience to send to'),
  testEmail: z.string().trim().email('Enter a valid email').or(z.literal('')),
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
 * be repeated, and so who was written to is answerable afterwards. A test send goes to
 * one address first, so the blast is never the first time anyone sees the email.
 *
 * Anyone on the suppression list, and any contact who has withdrawn consent, is skipped by
 * the server and reported separately from a failure.
 */
export function SendCampaignForm({ campaign, onDone, onCancel }: Readonly<SendCampaignFormProps>) {
  const notify = useNotify();
  const { data } = useListAudienceListsQuery();
  const [sendCampaign] = useSendCampaignMutation();
  const [testing, setTesting] = useState(false);
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { audienceListId: '', testEmail: '' },
  });

  const audienceListId = useWatch({ control: methods.control, name: 'audienceListId' });

  const options: SelectOption[] = (data?.listAudienceLists ?? []).map((audience) => ({
    value: audience.id,
    label: audience.name,
  }));
  const ready = Boolean(campaign.subject && campaign.body);

  const onSubmit = async (values: Values) => {
    try {
      const res = await sendCampaign({
        variables: { id: campaign.id, audienceListId: values.audienceListId },
      });
      const result = res.data?.sendCampaign;
      const failed = result?.failed ? ` · ${result.failed} failed` : '';
      const skipped = result?.skipped ? ` · ${result.skipped} skipped` : '';
      notify(`Campaign sent to ${result?.sent ?? 0} recipient(s)${failed}${skipped}`);
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'Send failed'), 'error');
    }
  };

  const sendTest = async () => {
    const valid = await methods.trigger('testEmail');
    const testEmail = methods.getValues('testEmail').trim();
    if (!valid) {
      return;
    }
    if (!testEmail) {
      methods.setError('testEmail', { message: 'Enter the address to send the test to' });
      return;
    }
    setTesting(true);
    try {
      await sendCampaign({ variables: { id: campaign.id, testEmail } });
      notify(`Test email sent to ${testEmail}`);
    } catch (err) {
      notify(errorMessage(err, 'Test send failed'), 'error');
    } finally {
      setTesting(false);
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
      <Stack direction="row" spacing={1} sx={{
        alignItems: "flex-start"
      }}>
        <RhfTextField
          name="testEmail"
          label="Test address"
          type="email"
          helperText="Preview the email in one inbox before it goes to the audience."
        />
        <Button variant="outlined" onClick={sendTest} disabled={!ready || testing} sx={{ mt: 1 }}>
          Send test
        </Button>
      </Stack>
      <RhfSelect
        name="audienceListId"
        label="Audience"
        options={options}
        helperText={options.length ? undefined : 'No audiences yet — create one first.'}
      />
      {audienceListId && <SendPreview campaignId={campaign.id} audienceListId={audienceListId} />}
    </EntityForm>
  );
}
