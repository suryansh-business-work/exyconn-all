import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Alert, Divider, Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useSaveMeetingSettingsMutation } from '@exyconn/shell/graphql/generated';
import { bookingLink } from '../../bookingLink';
import {
  meetingSettingsSchema,
  toMeetingSettingsValues,
  type MeetingSettingsRow,
  type MeetingSettingsValues,
} from './meeting-settings.types';

interface MeetingSettingsFormProps {
  initial: MeetingSettingsRow;
  /** The Slack channels to pick from; "Don't post" is always first. */
  channels: SelectOption[];
}

/** What shows the booking address, refreshed once it changes. */
const REFETCH = ['MeetingSettings', 'MeetingTypes', 'MeetingBookingPagePath'];

/** The booking page address the form would give, in full, as the slug is typed. */
function AddressPreview({ saved }: Readonly<{ saved: string }>) {
  const t = useT();
  const slug = useWatch<MeetingSettingsValues, 'bookingSlug'>({ name: 'bookingSlug' });
  const changed = slug.trim() !== saved;
  return (
    <>
      <Text size="sm" color="text.secondary">
        {t('Your booking page: {url}', { url: bookingLink(`/book/${slug.trim()}`) })}
      </Text>
      {changed && (
        <Alert severity="warning">
          {t(
            'Changing the address stops the old link working: anyone with {old} will see “page not found”. Share the new link once you save.',
            { old: bookingLink(`/book/${saved}`) },
          )}
        </Alert>
      )}
    </>
  );
}

/**
 * React Hook Form + Zod Meeting settings: the booking page address (a change is confirmed
 * first, as the old link stops working), the Slack channel told of each booking, and the fixed
 * Google Meet / Zoom rooms every confirmation and Slack post carries.
 */
export function MeetingSettingsForm({ initial, channels }: Readonly<MeetingSettingsFormProps>) {
  const notify = useNotify();
  const confirm = useConfirm();
  const [save] = useSaveMeetingSettingsMutation();
  const methods = useForm<MeetingSettingsValues>({
    mode: 'onTouched',
    resolver: zodResolver(meetingSettingsSchema),
    values: toMeetingSettingsValues(initial),
  });

  const onSubmit = async (values: MeetingSettingsValues) => {
    if (values.bookingSlug !== initial.bookingSlug) {
      const ok = await confirm({
        title: 'Change the booking page address?',
        message:
          'Links already shared ({old}) stop working straight away. Meeting links change too.',
        messageValues: { old: bookingLink(`/book/${initial.bookingSlug}`) },
        confirmText: 'Change address',
        destructive: true,
      });
      if (!ok) {
        return;
      }
    }
    try {
      await save({
        variables: { input: values },
        refetchQueries: REFETCH,
        awaitRefetchQueries: true,
      });
      notify('Meeting settings saved', 'success');
    } catch (error) {
      portalLogger.warn('crm: saving meeting settings failed', error);
      notify(errorMessage(error, 'Could not save the meeting settings'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={() => methods.reset(toMeetingSettingsValues(initial))}
      submitLabel="Save settings"
    >
      <RhfTextField
        name="bookingSlug"
        label="Booking page address"
        helperText="The last part of the link, e.g. meeting"
      />
      <AddressPreview saved={initial.bookingSlug} />
      <Divider />
      <RhfSelect
        name="slackChannel"
        label="Post new bookings to Slack"
        options={channels}
        helperText="Who booked, when and the meeting room go to this channel"
      />
      <Divider />
      <RhfTextField
        name="googleMeetUrl"
        label="Google Meet link"
        helperText="The same room for every meeting; sent in every confirmation"
      />
      <RhfTextField
        name="zoomUrl"
        label="Zoom link"
        helperText="The same room for every meeting; sent in every confirmation"
      />
    </EntityForm>
  );
}
