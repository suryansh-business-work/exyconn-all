import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useT } from '@exyconn/i18n';
import { Link, Stack, Text, iconSize } from '@exyconn/shell/components/ui';
import type { BookedMeeting } from './forms/book-meeting';

/** "Zoom: https://…" from Meeting settings, with the address as a link that opens the room. */
function JoinLink({ line }: Readonly<{ line: string }>) {
  const split = line.indexOf(': ');
  const label = line.slice(0, split);
  const url = line.slice(split + 2);
  return (
    <Text>
      {label}:{' '}
      <Link href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </Link>
    </Text>
  );
}

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
      {booked.joinLinks.map((line) => (
        <JoinLink key={line} line={line} />
      ))}
      <Text color="text.secondary">
        {t('A calendar confirmation is on its way to your inbox.')}
      </Text>
    </Stack>
  );
}
