import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useFormatters, useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import { RhfDateTimePicker, RhfRadioGroup } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useQueueCampaignSendMutation } from '@exyconn/shell/graphql/generated';
import { campaignScheduleSchema, type CampaignScheduleValues } from './campaign-schedule.types';

interface CampaignScheduleFormProps {
  campaignId: string;
  audienceListId: string;
  /** Unique addresses the send will reach, from the latest checks. */
  eligible: number;
  /** False while any check is an error; the send is refused by the server either way. */
  canSend: boolean;
  /** Saves the draft first, so the frozen revision is what is on screen. */
  beforeQueue: () => Promise<unknown>;
  onQueued: () => void;
}

const TIMING_OPTIONS = [
  { value: 'NOW', label: 'Send now', description: 'Starts within a minute, in small batches.' },
  { value: 'LATER', label: 'Schedule', description: 'Sends automatically at the time you choose.' },
];

/** Freezes the email into a revision and queues it, after confirming the exact count. */
export function CampaignScheduleForm({
  campaignId,
  audienceListId,
  eligible,
  canSend,
  beforeQueue,
  onQueued,
}: Readonly<CampaignScheduleFormProps>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatNumber, formatDateTime } = useFormatters();
  const [queue] = useQueueCampaignSendMutation();
  const methods = useForm<CampaignScheduleValues>({
    mode: 'onTouched',
    resolver: zodResolver(campaignScheduleSchema),
    defaultValues: { timing: 'NOW', scheduledAt: null },
  });
  const timing = useWatch({ control: methods.control, name: 'timing' });

  const submit = async (values: CampaignScheduleValues) => {
    if (!canSend) {
      notify('Fix the problems in the checks before sending.', 'error');
      return;
    }
    const later = values.timing === 'LATER' && values.scheduledAt;
    const ok = await confirm({
      title: later ? 'Schedule this campaign?' : 'Send this campaign now?',
      message: later
        ? 'It will go to {count} unique email address(es) on {when}. Unsubscribes and opt-outs are checked again as it sends.'
        : 'It will go to {count} unique email address(es) now. Unsubscribes and opt-outs are checked again as it sends.',
      messageValues: {
        count: formatNumber(eligible),
        when: later ? formatDateTime(values.scheduledAt ?? '') : '',
      },
      confirmText: later ? 'Schedule' : 'Send now',
    });
    if (!ok) return;
    try {
      await beforeQueue();
      await queue({
        variables: {
          id: campaignId,
          audienceListId,
          scheduledAt: later ? values.scheduledAt : null,
        },
      });
      notify(later ? 'Campaign scheduled' : 'Campaign is sending', 'success');
      onQueued();
    } catch (err) {
      notify(errorMessage(err, 'The campaign could not be queued'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={submit}
      isEdit={false}
      onCancel={() => methods.reset()}
      submitLabel={timing === 'LATER' ? 'Schedule campaign' : 'Send campaign'}
    >
      <RhfRadioGroup name="timing" label="When" options={TIMING_OPTIONS} />
      {timing === 'LATER' && (
        <RhfDateTimePicker
          name="scheduledAt"
          label="Send at"
          helperText="In your timezone. The email content is frozen when you schedule."
        />
      )}
      {!canSend && (
        <Alert severity="warning">{t('Fix the problems in the checks before sending.')}</Alert>
      )}
    </EntityForm>
  );
}
