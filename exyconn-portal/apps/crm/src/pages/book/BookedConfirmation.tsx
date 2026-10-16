import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useT } from '@exyconn/i18n';
import { Stack, Text, iconSize } from '@exyconn/shell/components/ui';
import type { BookedMeeting } from './forms/book-meeting';

/** "You are scheduled": what, when, with whom and where. */
export function BookedConfirmation({
  booked,
  chosen,
  zone,
}: Readonly<{ booked: BookedMeeting; chosen: string; zone: string }>) {
  const t = useT();
  return (
    <Stack spacing={1.5} sx={{ textAlign: 'center', alignItems: 'center', py: 4 }}>
      <EventAvailableIcon color="success" sx={{ fontSize: iconSize['5xl'] }} />
      <Text component="h2" size="lg" weight="bold">
        {t('You are scheduled')}
      </Text>
      <Text>{t('{meeting} with {host}', { meeting: booked.title, host: booked.hostName })}</Text>
      <Text weight="semibold">
        {chosen} ({zone})
      </Text>
      {booked.location && <Text>{t('Where: {location}', { location: booked.location })}</Text>}
      <Text color="text.secondary">
        {t('A calendar confirmation is on its way to your inbox.')}
      </Text>
    </Stack>
  );
}
