import { useFormatters, useT } from '@exyconn/i18n';
import CallEndIcon from '@mui/icons-material/CallEnd';
import {
  Alert,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Text,
  Typography,
} from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { MaBotStatus } from '@exyconn/shell/graphql/generated';
import { isMoving, type DemoTrip } from '../pages/meeting-bot/useMeetingBotDemo';
import { TripNotes } from './TripNotes';

const ACTIVE = new Set<MaBotStatus>([
  MaBotStatus.Queued,
  MaBotStatus.Joining,
  MaBotStatus.WaitingAdmit,
  MaBotStatus.InCall,
]);

/** What the visitor reads under a trip while there are no notes to show. */
const WAITING_TEXT: Partial<Record<MaBotStatus, string>> = {
  [MaBotStatus.Queued]: 'The bot is on its way to your call.',
  [MaBotStatus.Joining]: 'The bot is opening your call.',
  [MaBotStatus.WaitingAdmit]: 'The bot is in the lobby. Admit it from your call.',
  [MaBotStatus.InCall]: 'The bot is in your call, recording. Notes follow when the call ends.',
  [MaBotStatus.Done]: 'The call has ended. The notes are being written.',
};

/** Below the heading: the notes, or why there are none (yet). */
function TripBody({ trip }: Readonly<{ trip: DemoTrip }>) {
  const t = useT();
  if (trip.purged) {
    return (
      <Text color="text.secondary">{t('This recording and its notes have been deleted.')}</Text>
    );
  }
  if (trip.summary) {
    return <TripNotes summary={trip.summary} />;
  }
  if (trip.status === MaBotStatus.Failed) {
    return <Alert severity="error">{trip.error || t('The bot could not record this call.')}</Alert>;
  }
  const waiting = WAITING_TEXT[trip.status];
  if (waiting && isMoving(trip)) {
    return (
      <Stack spacing={1}>
        <Text color="text.secondary">{t(waiting)}</Text>
        <LinearProgress aria-label={t('Waiting for the bot')} />
      </Stack>
    );
  }
  return <Text color="text.secondary">{t('No notes were made for this call.')}</Text>;
}

interface TripCardProps {
  trip: DemoTrip;
  onCallBack: (trip: DemoTrip) => void;
}

/** One trip of the bot: the call, where the bot is, and the notes once written. */
export function TripCard({ trip, onCallBack }: Readonly<TripCardProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const emailed = trip.emailedAt
    ? t('Notes emailed to you {when}.', { when: formatDateTime(trip.emailedAt) })
    : '';
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
              {trip.meetingCode}
            </Typography>
            <StatusChip value={trip.status} />
            {ACTIVE.has(trip.status) && (
              <Button
                size="small"
                color="error"
                startIcon={<CallEndIcon />}
                onClick={() => onCallBack(trip)}
              >
                {t('Call back')}
              </Button>
            )}
          </Stack>
          <Text color="text.secondary">
            {t('Sent {when}. Deleted {purge}.', {
              when: formatDateTime(trip.createdAt),
              purge: formatDateTime(trip.purgeAfter),
            })}{' '}
            {emailed}
          </Text>
          <TripBody trip={trip} />
        </Stack>
      </CardContent>
    </Card>
  );
}
