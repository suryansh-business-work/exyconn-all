import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useBookMeetingMutation } from '@exyconn/shell/graphql/generated';
import { visitorZone } from '../../useVisitorTime';
import {
  bookMeetingSchema,
  type BookedMeeting,
  type BookMeetingValues,
} from './book-meeting.types';

interface BookMeetingFormProps {
  slug: string;
  startAt: string;
  onBooked: (booked: BookedMeeting) => void;
  onBack: () => void;
}

/** React Hook Form + Zod form: who is booking the chosen time, and anything to share first. */
export function BookMeetingForm({
  slug,
  startAt,
  onBooked,
  onBack,
}: Readonly<BookMeetingFormProps>) {
  const notify = useNotify();
  const [book] = useBookMeetingMutation();
  const methods = useForm<BookMeetingValues>({
    mode: 'onTouched',
    resolver: zodResolver(bookMeetingSchema),
    defaultValues: { name: '', email: '', notes: '' },
  });

  const onSubmit = async (values: BookMeetingValues) => {
    try {
      const { data } = await book({
        variables: { slug, input: { ...values, startAt, timezone: visitorZone() } },
      });
      if (data) {
        onBooked(data.bookMeeting);
      }
    } catch (error) {
      portalLogger.warn('status: booking a meeting failed', error);
      notify(errorMessage(error, 'The meeting could not be booked'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Book meeting"
      onCancel={onBack}
    >
      <RhfTextField name="name" label="Your name" autoComplete="name" />
      <RhfTextField name="email" label="Your email" type="email" autoComplete="email" />
      <RhfTextField
        name="notes"
        label="Anything we should know?"
        multiline
        minRows={3}
        helperText="Optional: what you would like to talk about"
      />
    </EntityForm>
  );
}
