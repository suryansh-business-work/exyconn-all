import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Stack, Text } from '@exyconn/shell/components/ui';
import { usePublicMeetingQuery } from '@exyconn/shell/graphql/generated';
import { BookedConfirmation } from './BookedConfirmation';
import { BookingFrame } from './BookingFrame';
import { MeetingBookingSkeleton } from './BookingSkeletons';
import { BookMeetingForm, type BookedMeeting } from './forms/book-meeting';
import { MeetingSummary } from './MeetingSummary';
import { SlotStep } from './SlotStep';
import { browserZone, useBookingTime } from './useBookingTime';

/**
 * A meeting's public booking page (crm.exyconn.com/book/:org/:slug), with no sign-in: pick a
 * day and a free time, enter your details, and the meeting is booked — like Calendly.
 */
export function BookMeetingPage() {
  const t = useT();
  const { org = '', slug = '' } = useParams();
  const [zone, setZone] = useState(browserZone);
  const [startAt, setStartAt] = useState<string | null>(null);
  const [booked, setBooked] = useState<BookedMeeting | null>(null);
  const when = useBookingTime(zone);
  const { data, loading, error } = usePublicMeetingQuery({ variables: { org, slug } });
  const meeting = data?.publicMeeting;

  if (loading && !meeting) {
    return <MeetingBookingSkeleton />;
  }
  if (!meeting) {
    return (
      <BookingFrame>
        <Alert severity="warning">
          {error ? t('This booking link no longer works.') : t('Meeting not found.')}
        </Alert>
      </BookingFrame>
    );
  }
  const end = startAt
    ? new Date(new Date(startAt).getTime() + meeting.durationMinutes * 60_000)
    : null;
  const chosen =
    startAt && end
      ? `${when.time(startAt)} – ${when.time(end)}, ${when.dayTitle(new Date(startAt))}`
      : undefined;

  let step = <SlotStep org={org} slug={slug} zone={zone} onZone={setZone} onPick={setStartAt} />;
  if (booked && chosen) {
    step = <BookedConfirmation booked={booked} chosen={chosen} zone={zone} />;
  } else if (startAt) {
    step = (
      <Stack spacing={2}>
        <Text component="h2" size="lg" weight="bold">
          {t('Enter Details')}
        </Text>
        <BookMeetingForm
          org={org}
          slug={slug}
          startAt={startAt}
          zone={zone}
          onBooked={setBooked}
          onBack={() => setStartAt(null)}
        />
      </Stack>
    );
  }
  return (
    <BookingFrame
      aside={<MeetingSummary meeting={meeting} chosen={chosen} zone={startAt ? zone : undefined} />}
    >
      {step}
    </BookingFrame>
  );
}
