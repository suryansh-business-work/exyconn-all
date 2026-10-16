import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import {
  fontWeight,
  AdapterDateFns,
  Card,
  Chip,
  Flex,
  LocalizationProvider,
  Stack,
  Typography,
} from '@exyconn/shell/components/ui';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { usePublicMeetingQuery } from '@exyconn/shell/graphql/generated';
import { LinkExpiredCard } from '../../components/LinkExpiredCard';
import { BookedCard } from './BookedCard';
import { BookMeetingForm, type BookedMeeting } from './forms/book-meeting';
import { SlotPicker } from './SlotPicker';
import { useVisitorTime } from './useVisitorTime';

/**
 * A public booking page (status.exyconn.com/book/:slug), Calendly-style and with no sign-in:
 * pick a free time from the host's availability, say who you are, and the meeting is booked.
 */
export function BookMeetingPage() {
  const t = useT();
  const when = useVisitorTime();
  const { slug = '' } = useParams();
  const [startAt, setStartAt] = useState<string | null>(null);
  const [booked, setBooked] = useState<BookedMeeting | null>(null);
  const { data, loading } = usePublicMeetingQuery({ variables: { slug }, skip: slug === '' });

  if (loading) {
    return <LoadingState />;
  }
  const meeting = data?.publicMeeting;
  if (!meeting) {
    return <LinkExpiredCard />;
  }
  if (booked) {
    return <BookedCard booked={booked} />;
  }
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card variant="outlined" sx={{ p: { xs: 2, md: 4 } }}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" component="h1">
              {meeting.title}
            </Typography>
            <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={t('with {host}', { host: meeting.hostName })} />
              <Chip
                variant="outlined"
                label={t('{minutes} min', { minutes: meeting.durationMinutes })}
              />
            </Flex>
            {meeting.description && (
              <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {meeting.description}
              </Typography>
            )}
          </Stack>
          {startAt ? (
            <>
              <Typography sx={{ fontWeight: fontWeight.bold }}>{when.dateTime(startAt)}</Typography>
              <BookMeetingForm
                slug={slug}
                startAt={startAt}
                onBooked={setBooked}
                onBack={() => setStartAt(null)}
              />
            </>
          ) : (
            <SlotPicker slug={slug} onPick={setStartAt} />
          )}
        </Stack>
      </Card>
    </LocalizationProvider>
  );
}
