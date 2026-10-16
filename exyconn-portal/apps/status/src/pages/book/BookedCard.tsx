import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useT } from '@exyconn/i18n';
import { Card, Typography, fontWeight, iconSize } from '@exyconn/shell/components/ui';
import type { BookedMeeting } from './forms/book-meeting';
import { useVisitorTime } from './useVisitorTime';

/** The confirmation: what, when (in the visitor's zone), with whom and where. */
export function BookedCard({ booked }: Readonly<{ booked: BookedMeeting }>) {
  const t = useT();
  const when = useVisitorTime();
  return (
    <Card variant="outlined" sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <EventAvailableIcon color="success" sx={{ fontSize: iconSize['5xl'] }} />
      <Typography variant="h5" component="h1" sx={{ mt: 1 }}>
        {t('You are booked')}
      </Typography>
      <Typography sx={{ mt: 1 }}>
        {t('{meeting} with {host}', { meeting: booked.title, host: booked.hostName })}
      </Typography>
      <Typography sx={{ mt: 1, fontWeight: fontWeight.bold }}>
        {when.dateTime(booked.startAt)} – {when.time(booked.endAt)} ({when.zone})
      </Typography>
      {booked.location && (
        <Typography sx={{ mt: 1 }}>
          {t('Where: {location}', { location: booked.location })}
        </Typography>
      )}
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        {t('A confirmation is on its way to your inbox.')}
      </Typography>
    </Card>
  );
}
