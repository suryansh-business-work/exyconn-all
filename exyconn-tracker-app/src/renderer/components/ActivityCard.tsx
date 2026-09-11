import type { ReactElement, ReactNode } from 'react';
import { Box, Stack, trackerActivity, Typography, useTheme } from '@exyconn/ui';
import { ACTIVITY_LEGEND, activityLevel } from '@exyconn/tracker-core';
import Surface from './Surface';

interface Props {
  title: string;
  /** The chart's headline activity, in percent; null hides it (nothing tracked yet). */
  percent: number | null;
  children: ReactNode;
}

/** One legend entry: the level's dot and its range. */
function LegendItem({ hue, label }: Readonly<{ hue: string; label: string }>): ReactElement {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: hue }} />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
    </Stack>
  );
}

/**
 * A card around an activity chart: the title, the headline percentage in its level's colour,
 * and the legend that says what each colour means — colour is never the only carrier.
 */
export default function ActivityCard({ title, percent, children }: Readonly<Props>): ReactElement {
  const theme = useTheme();
  const hues = trackerActivity[theme.palette.mode];
  return (
    <Surface sx={{ p: 2.5 }}>
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="h6">{title}</Typography>
        {percent === null ? null : (
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: hues[activityLevel(percent)] }}
          >
            {percent}%
          </Typography>
        )}
      </Stack>
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end', mt: 0.5, mb: 1.5 }}>
        {ACTIVITY_LEGEND.map((entry) => (
          <LegendItem key={entry.level} hue={hues[entry.level]} label={entry.label} />
        ))}
      </Stack>
      {children}
    </Surface>
  );
}
