import { useT } from '@exyconn/i18n';
import { Alert, Button, CircularProgress, Stack, Text } from '@exyconn/shell/components/ui';
import type { MeetingBotDemo } from '../pages/meeting-bot/useMeetingBotDemo';
import { TripCard } from './TripCard';

/** The visitor's own calls, newest first, with the loading, error and empty states. */
export function TripList({ demo }: Readonly<{ demo: MeetingBotDemo }>) {
  const t = useT();
  if (demo.tripsError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => demo.retryTrips()}>
            {t('Retry')}
          </Button>
        }
      >
        {demo.tripsError}
      </Alert>
    );
  }
  if (demo.tripsLoading) {
    return <CircularProgress aria-label={t('Loading')} />;
  }
  if (demo.trips.length === 0) {
    return (
      <Text color="text.secondary">
        {t('No calls yet. Send the notetaker to a call above and its notes appear here.')}
      </Text>
    );
  }
  return (
    <Stack spacing={2}>
      {demo.trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} onCallBack={demo.callBack} />
      ))}
    </Stack>
  );
}
