import { format } from 'date-fns';
import { useT } from '@exyconn/i18n';
import { Box, Text, Chip } from '@exyconn/shell/components/ui';
import type { DayMarker } from './buildMonth';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** What an off day shows: its words, its colour, and whether it is the employee's own leave. */
interface OffMark {
  text: string;
  color: string;
  isLeave: boolean;
}

/**
 * One mark per day, in the order the server reads a day: a holiday, then the employee's week
 * off, then their leave.
 */
function offMarkOf(day: DayMarker, t: (text: string) => string): OffMark | null {
  if (day.holiday) return { text: day.holiday, color: 'secondary.main', isLeave: false };
  if (day.weekOff) return { text: t('Week off'), color: 'text.secondary', isLeave: false };
  if (day.onLeave) return { text: day.leaveType ?? t('Leave'), color: 'info.main', isLeave: true };
  return null;
}

/** The mark in full on a wide screen: a chip for leave, coloured words otherwise. */
function OffMarkLabel({ mark }: Readonly<{ mark: OffMark }>) {
  if (mark.isLeave) {
    return (
      <Chip
        size="small"
        label={mark.text}
        color="info"
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      />
    );
  }
  // Clipped rather than truncated on a phone: with 40px to work in, an ellipsis is the whole
  // word. The dot below stands in for it there.
  return (
    <Text size="caption" color={mark.color} noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
      {mark.text}
    </Text>
  );
}

/** A single day cell — dims out-of-month days and overlays its holiday, week off or leave. */
function DayCell({ day }: Readonly<{ day: DayMarker }>) {
  const t = useT();
  const mark = offMarkOf(day, t);
  return (
    <Box
      sx={{
        minHeight: { xs: 56, sm: 72 },
        // A cell is about 40px wide on a phone; padding at that size leaves no room for the
        // date itself, let alone what is happening on it.
        p: { xs: 0.5, sm: 1 },
        minWidth: 0,
        borderRadius: 1,
        border: 1,
        borderColor: day.isToday ? 'primary.main' : 'divider',
        opacity: day.inMonth ? 1 : 0.4,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Text size="sm" weight={day.isToday ? 'bold' : 'regular'}>
        {format(day.date, 'd')}
      </Text>
      {mark && (
        <>
          <OffMarkLabel mark={mark} />
          <Box
            aria-label={mark.text}
            sx={{
              display: { xs: 'block', sm: 'none' },
              width: 6,
              height: 6,
              borderRadius: 1,
              bgcolor: mark.color,
            }}
          />
        </>
      )}
    </Box>
  );
}

/** Renders a 7-column month grid: a weekday header row followed by day cells. */
export function MonthGrid({ days }: Readonly<{ days: DayMarker[] }>) {
  const t = useT();
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: { xs: 0.5, sm: 0.5 },
      }}
    >
      {WEEKDAYS.map((label) => (
        <Text key={label} size="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {t(label)}
        </Text>
      ))}
      {days.map((day) => (
        <DayCell key={day.date.toISOString()} day={day} />
      ))}
    </Box>
  );
}
