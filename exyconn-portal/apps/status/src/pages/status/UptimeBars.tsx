import { Box, Flex, Tooltip, Typography, useTheme, type Theme } from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import { DATE_FORMAT } from '../../status.constants';
import type { StatusDay } from './status.types';

/** Green only for a flawless day; grey means the day was never measured. */
function barColor(day: StatusDay, theme: Theme): string {
  if (day.checks === 0) {
    return theme.palette.action.disabledBackground;
  }
  if (day.failures === 0) {
    return theme.palette.success.main;
  }
  return day.uptimePercent >= 90 ? theme.palette.warning.main : theme.palette.error.main;
}

/** Tooltip wording for one bar — kept out of the JSX so it stays a plain string. */
function barLabel(day: StatusDay): string {
  const date = formatWith(day.date, DATE_FORMAT);
  if (day.checks === 0) {
    return `${date} — no data`;
  }
  return `${date} — ${day.uptimePercent}% uptime, ${day.failures} of ${day.checks} checks failed`;
}

interface UptimeBarsProps {
  days: StatusDay[];
}

/** One bar per day, oldest on the left — the shape every status page uses. */
export function UptimeBars({ days }: Readonly<UptimeBarsProps>) {
  const theme = useTheme();
  const first = days[0];
  const last = days[days.length - 1];

  return (
    <Box>
      <Flex spacing={0.25} sx={{ height: 32, alignItems: 'stretch' }}>
        {days.map((day) => (
          <Tooltip key={day.date} title={barLabel(day)} arrow enterTouchDelay={0}>
            <Box
              sx={{
                flex: 1,
                minWidth: 2,
                borderRadius: 0.5,
                bgcolor: barColor(day, theme),
                transition: 'transform 120ms',
                '&:hover': { transform: 'scaleY(1.12)' },
              }}
            />
          </Tooltip>
        ))}
      </Flex>
      <Flex justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {formatWith(first?.date, DATE_FORMAT)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatWith(last?.date, DATE_FORMAT)}
        </Typography>
      </Flex>
    </Box>
  );
}
