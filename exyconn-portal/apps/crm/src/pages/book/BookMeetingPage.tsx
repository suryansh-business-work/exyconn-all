import { useState } from 'react';
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
import { useBookingAddress } from './useBookingAddress';
import { useTrackView } from './useTrackView';

/**
 * A meeting's public booking page (/organization/:org/book/:page/:slug), with no sign-in: pick a
 * day and a free time, enter your details, and the meeting is booked — like Calendly.
 */
export function BookMeetingPage() {
  const t = useT();
  const { at, slug } = useBookingAddress();
  const [zone, setZone] = useState(browserZone);
  const [startAt, setStartAt] = useState<string | null>(null);
  const [booked, setBooked] = useState<BookedMeeting | null>(null);
  const when = useBookingTime(zone);
  const { data, loading, error } = usePublicMeetingQuery({ variables: { ...at, slug } });
  const meeting = data?.publicMeeting;
  useTrackView(at, slug, Boolean(meeting));

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
  let chosen: string | undefined;
  if (startAt) {
    const start = new Date(startAt);
    const end = new Date(start.getTime() + meeting.durationMinutes * 60_000);
    chosen = `${when.time(start)} – ${when.time(end)}, ${when.dayTitle(start)}`;
  }

  let step = <SlotStep at={at} slug={slug} zone={zone} onZone={setZone} onPick={setStartAt} />;
  if (chosen && booked) {
    step = <BookedConfirmation booked={booked} chosen={chosen} zone={zone} />;
  } else if (startAt) {
    step = (
      <Stack spacing={2}>
        <Text component="h2" size="lg" weight="bold">
          {t('Enter Details')}
        </Text>
        <BookMeetingForm
          at={at}
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
      brand={meeting}
      aside={
        <MeetingSummary
          meeting={meeting}
          backTo={`/book/${at.page}`}
          chosen={chosen}
          zone={startAt ? zone : undefined}
        />
      }
    >
      {step}
    </BookingFrame>
  );
}
