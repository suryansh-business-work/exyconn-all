import { format } from 'date-fns';
import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import type { AttendanceDay } from './attendanceDays';
import { DAY_STATUS_STYLE } from './dayStatusStyle';

/** One day: its date, a coloured edge and wash for its status, and the status in words. */
export function AttendanceDayCell({ day }: Readonly<{ day: AttendanceDay }>) {
  const t = useT();
  const style = day.status === 'NONE' ? null : DAY_STATUS_STYLE[day.status];
  const label = [format(day.date, 'd MMMM'), style && t(style.label), day.holiday]
    .filter(Boolean)
    .join(', ');
  return (
    <Box
      aria-label={label}
      sx={{
        minHeight: { xs: 52, sm: 72 },
        p: { xs: 0.5, sm: 1 },
        minWidth: 0,
        borderRadius: 1.5,
        border: 1,
        borderColor: day.isToday ? 'primary.main' : 'divider',
        borderLeftWidth: style ? 4 : 1,
        borderLeftColor: style?.tone ?? 'divider',
        // Other months' days are quieter, not faded: faded text fails contrast (SC 1.4.3).
        bgcolor: day.inMonth ? 'background.paper' : 'action.hover',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Text
        size="sm"
        weight={day.isToday ? 'bold' : 'regular'}
        color={day.inMonth ? 'text.primary' : 'text.secondary'}
      >
        {format(day.date, 'd')}
      </Text>
      {style && (
        <Text
          size="caption"
          noWrap
          sx={{ color: style.tone, fontWeight: 600, display: { xs: 'none', sm: 'block' } }}
        >
          {t(style.label)}
        </Text>
      )}
      {day.holiday && day.status !== 'HOLIDAY' && (
        <Text
          size="caption"
          color="text.secondary"
          noWrap
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          {day.holiday}
        </Text>
      )}
    </Box>
  );
}
