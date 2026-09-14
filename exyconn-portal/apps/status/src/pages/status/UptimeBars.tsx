import {
  Box,
  duration,
  Flex,
  Tooltip,
  Typography,
  useTheme,
  type Theme,
} from '@exyconn/shell/components/ui';
import { useT, type Interpolations } from '@exyconn/i18n';
import { formatWith } from '@exyconn/shell/utils/date';
import { DATE_FORMAT } from '../../status.constants';
import type { StatusDay } from './status.types';
import { useRovingFocus } from './useRovingFocus';

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
function barLabel(day: StatusDay, t: (source: string, values?: Interpolations) => string): string {
  const date = formatWith(day.date, DATE_FORMAT);
  if (day.checks === 0) {
    return t('{date} — no data', { date });
  }
  if (day.checks === 1) {
    return t('{date} — {percent}% uptime, {failures} of 1 check failed', {
      date,
      percent: day.uptimePercent,
      failures: day.failures,
    });
  }
  return t('{date} — {percent}% uptime, {failures} of {checks} checks failed', {
    date,
    percent: day.uptimePercent,
    failures: day.failures,
    checks: day.checks,
  });
}

interface UptimeBarsProps {
  days: StatusDay[];
}

/** One bar per day, oldest on the left — the shape every status page uses. */
export function UptimeBars({ days }: Readonly<UptimeBarsProps>) {
  const t = useT();
  const theme = useTheme();
  const first = days[0];
  const last = days[days.length - 1];
  const roving = useRovingFocus(days.length);

  return (
    <Box>
      {/* One tab stop; the arrow keys move along the days (SC 2.1.1), and each bar says in
          words what its colour shows (SC 1.1.1, 1.4.1). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- roving focus: the group only forwards arrow keys between its focusable bars */}
      <Flex
        role="group"
        aria-label={t('Daily uptime')}
        onKeyDown={roving.onKeyDown}
        spacing={0.5}
        sx={{ height: 32, alignItems: 'stretch' }}
      >
        {days.map((day, index) => (
          <Tooltip key={day.date} title={barLabel(day, t)} arrow enterTouchDelay={0}>
            <Box
              role="img"
              aria-label={barLabel(day, t)}
              {...roving.itemProps(index)}
              sx={{
                flex: 1,
                minWidth: 2,
                borderRadius: 0.5,
                bgcolor: barColor(day, theme),
                transition: `transform ${duration.fast}ms`,
                '&:hover, &:focus-visible': { transform: 'scaleY(1.12)' },
              }}
            />
          </Tooltip>
        ))}
      </Flex>
      <Flex justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {formatWith(first?.date, DATE_FORMAT)}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {formatWith(last?.date, DATE_FORMAT)}
        </Typography>
      </Flex>
    </Box>
  );
}
