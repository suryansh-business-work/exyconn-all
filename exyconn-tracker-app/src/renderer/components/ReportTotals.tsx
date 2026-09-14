import type { ReactElement } from 'react';
import { alpha, borderWidth, Box, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import Surface from './Surface';
import type { ReportTotals as Totals } from '../hooks/useMyReport';
import { formatHoursMinutes } from '@exyconn/tracker-core';

interface Props {
  totals: Totals;
}

interface Summary {
  id: string;
  label: string;
  value: string;
}

function summaries(totals: Totals): Summary[] {
  return [
    { id: 'worked', label: 'Total worked', value: formatHoursMinutes(totals.activeMs) },
    { id: 'idle', label: 'Total idle', value: formatHoursMinutes(totals.idleMs) },
    { id: 'activity', label: 'Avg activity', value: `${totals.activityPercent}%` },
  ];
}

/** The month's headline numbers, above the day-by-day table. */
export default function ReportTotals({ totals }: Readonly<Props>): ReactElement {
  const t = useT();
  return (
    <Surface
      sx={{
        p: 2,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
      }}
    >
      {summaries(totals).map((item) => (
        <Box
          key={item.id}
          sx={(theme) => ({
            px: 1,
            borderLeft: `${borderWidth.hairline}px solid ${alpha(theme.palette.text.primary, 0.1)}`,
            '&:first-of-type': { borderLeft: 'none' },
          })}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
            }}
          >
            {t(item.label)}
          </Typography>
          <Typography variant="h6" component="p" sx={{ overflowWrap: 'anywhere' }}>
            {item.value}
          </Typography>
        </Box>
      ))}
    </Surface>
  );
}
