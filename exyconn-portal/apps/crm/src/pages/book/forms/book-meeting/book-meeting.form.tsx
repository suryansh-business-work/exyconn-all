import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useT } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import { RhfChipsInput, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useBookMeetingMutation } from '@exyconn/shell/graphql/generated';
import {
  bookMeetingSchema,
  type BookedMeeting,
  type BookMeetingValues,
} from './book-meeting.types';
import type { BookingAddress } from '../../useBookingAddress';

interface BookMeetingFormProps {
  at: BookingAddress;
  slug: string;
  startAt: string;
  zone: string;
  onBooked: (booked: BookedMeeting) => void;
  onBack: () => void;
}

/** React Hook Form + Zod "Enter Details": who is booking, who else to invite, and a note. */
export function BookMeetingForm({
  at,
  slug,
  startAt,
  zone,
  onBooked,
  onBack,
}: Readonly<BookMeetingFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [book] = useBookMeetingMutation();
  const [withGuests, setWithGuests] = useState(false);
  const methods = useForm<BookMeetingValues>({
    mode: 'onTouched',
    resolver: zodResolver(bookMeetingSchema),
    defaultValues: { name: '', email: '', guests: [], notes: '' },
  });

  const onSubmit = async (values: BookMeetingValues) => {
    try {
      const { data } = await book({
        variables: { ...at, slug, input: { ...values, startAt, timezone: zone } },
      });
      if (data) {
        onBooked(data.bookMeeting);
      }
    } catch (error) {
      portalLogger.warn('crm: booking a meeting failed', error);
      notify(errorMessage(error, 'The meeting could not be booked'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Schedule Event"
      onCancel={onBack}
    >
      <RhfTextField
        name="name"
        label="Name"
        autoComplete="name"
        helperText="So the host knows who they are meeting."
      />
      <RhfTextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        helperText="We send the booking confirmation here."
      />
      {withGuests ? (
        <RhfChipsInput
          name="guests"
          label="Guest emails"
          helperText="Type an address and press Enter (up to 10)"
        />
      ) : (
        <Button
          variant="outlined"
          size="small"
          sx={{ alignSelf: 'flex-start' }}
          onClick={() => setWithGuests(true)}
        >
          {t('Add guests')}
        </Button>
      )}
      <RhfTextField
        name="notes"
        label="Please share anything that will help prepare for our meeting."
        multiline
        minRows={3}
        helperText="Optional. Up to 2000 characters, e.g. topics you want to cover."
      />
    </EntityForm>
  );
}
