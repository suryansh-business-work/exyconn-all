import type { ReactElement } from 'react';
import { Box, Stack, Typography, useTheme } from '@exyconn/ui';
import type { DayMark } from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';
import { markRing } from './TrackedDay';

/** Every ring the calendar draws, in the order the legend lists them. */
const LEGEND: ReadonlyArray<{ mark: DayMark; label: string }> = [
  { mark: 'SHORT', label: 'Short' },
  { mark: 'LEAVE', label: 'Leave' },
  { mark: 'HOLIDAY', label: 'Holiday' },
  { mark: 'WEEK_OFF', label: 'Week off' },
];

/** What each ring on the report calendar means, each drawn exactly as the grid draws it. */
export default function CalendarLegend(): ReactElement {
  const theme = useTheme();
  const t = useT();
  return (
    <Stack
      component="ul"
      direction="row"
      useFlexGap
      spacing={1.5}
      sx={{ flexWrap: 'wrap', justifyContent: 'center', listStyle: 'none', m: 0, p: 0 }}
    >
      {LEGEND.map((item) => (
        <Stack
          key={item.mark}
          component="li"
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'center' }}
        >
          <Box
            aria-hidden
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              boxShadow: markRing(item.mark, theme),
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t(item.label)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
