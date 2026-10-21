import { useT } from '@exyconn/i18n';
import { Box, Chip, Text } from '@exyconn/shell/components/ui';
import type { CalendarEvent } from './calendar-entries';
import { responseLabel } from './event-time';

type Attendee = CalendarEvent['attendees'][number];

const COLOR: Readonly<Record<string, 'success' | 'error' | 'warning'>> = {
  accepted: 'success',
  declined: 'error',
  tentative: 'warning',
};

function AttendeeRow({ attendee }: Readonly<{ attendee: Attendee }>) {
  const t = useT();
  const name = attendee.name ?? attendee.email ?? t('Unknown guest');
  return (
    <Box component="li" sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Text component="span" size="sm" sx={{ display: 'block', overflowWrap: 'anywhere' }}>
          {attendee.organizer ? t('{name} (organizer)', { name }) : name}
        </Text>
        {attendee.name && attendee.email && (
          <Text component="span" size="caption" color="text.secondary" sx={{ display: 'block' }}>
            {attendee.email}
          </Text>
        )}
      </Box>
      <Chip
        size="small"
        variant="outlined"
        color={COLOR[attendee.responseStatus] ?? 'default'}
        label={t(responseLabel(attendee.responseStatus))}
      />
    </Box>
  );
}

/** Who was invited and how each answered. */
export function EventAttendees({ attendees }: Readonly<{ attendees: CalendarEvent['attendees'] }>) {
  const t = useT();
  if (attendees.length === 0) {
    return null;
  }
  return (
    <Box component="section" aria-label={t('Guests')} sx={{ mt: 2 }}>
      <Text size="sm" weight="semibold">
        {t('Guests ({count})', { count: attendees.length })}
      </Text>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {attendees.map((attendee) => (
          <AttendeeRow key={`${attendee.email}:${attendee.name}`} attendee={attendee} />
        ))}
      </Box>
    </Box>
  );
}
