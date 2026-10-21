import { useI18n, useT } from '@exyconn/i18n';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import type { CalendarEvent } from './calendar-entries';
import { eventWhen } from './event-time';
import { EventAttendees } from './EventAttendees';

interface CalendarEventDialogProps {
  event: CalendarEvent | null;
  onClose: () => void;
  now?: Date;
}

function organizerOf(event: CalendarEvent): string {
  const { organizerName: name, organizerEmail: email } = event;
  if (name && email) {
    return `${name} (${email})`;
  }
  return name ?? email ?? '—';
}

function EventDetails({ event, now }: Readonly<{ event: CalendarEvent; now: Date }>) {
  const t = useT();
  const { settings } = useI18n();
  const upcoming = new Date(event.endsAt).getTime() > now.getTime();
  return (
    <>
      <DetailFactGrid>
        <DetailFact label="When">{t('{from} to {to}', eventWhen(event, settings))}</DetailFact>
        <DetailFact label="Organizer">{organizerOf(event)}</DetailFact>
        <DetailFact label="Meeting code">{event.meetingCode}</DetailFact>
      </DetailFactGrid>
      {upcoming && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('Open the meeting in Chrome and click Start in the extension to record it.')}
        </Alert>
      )}
      <EventAttendees attendees={event.attendees} />
      {event.description && (
        <Box
          component="p"
          aria-label={t('Description')}
          sx={{ mt: 2, mb: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {event.description}
        </Box>
      )}
    </>
  );
}

/**
 * A Google Calendar event nothing recorded yet: when, who, what it is about and its Meet link.
 * The description is Google's text rendered as text, never as HTML.
 */
export function CalendarEventDialog({
  event,
  onClose,
  now = new Date(),
}: Readonly<CalendarEventDialogProps>) {
  const t = useT();
  return (
    <Dialog open={event !== null} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{event?.title || t('Untitled meeting')}</DialogTitle>
      <DialogContent>{event && <EventDetails event={event} now={now} />}</DialogContent>
      <DialogActions>
        {event && (
          <Button
            component="a"
            href={event.meetUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            startIcon={<VideoCallIcon />}
          >
            {t('Open in Google Meet')}
          </Button>
        )}
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
