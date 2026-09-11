import type { ReactElement } from 'react';
import { alpha, Box, Stack, trackerActivity, Typography, useTheme } from '@exyconn/ui';
import type { ActivityLevel, ChartBar } from '@exyconn/tracker-core';

/** The SVG's own coordinate width; it is stretched to the card, so only proportions matter. */
const VIEW_WIDTH = 1000;
/** The share of each slot left empty between bars, so neighbours read as separate stripes. */
const GAP = 0.3;
/** An empty or near-empty slot still draws a sliver, so "nothing here" is visibly a slot. */
const MIN_BAR = 3;

export interface AxisLabels {
  start: string;
  middle: string;
  end: string;
}

interface Props {
  bars: readonly ChartBar[];
  /** The x axis's three labels. */
  labels: AxisLabels;
  /** What the chart says, for a screen reader — the bars themselves are not read out. */
  summary: string;
  height?: number;
}

function AxisLabel({ text }: Readonly<{ text: string }>): ReactElement {
  return (
    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
      {text}
    </Typography>
  );
}

/**
 * Bars as thin coloured stripes, their colour the activity level: the day's intervals by time,
 * or a period's days. Plain SVG stretched to the card; the labels sit under it as text, so
 * stretching never distorts them.
 */
export default function StripesChart({
  bars,
  labels,
  summary,
  height = 140,
}: Readonly<Props>): ReactElement {
  const theme = useTheme();
  const hues = trackerActivity[theme.palette.mode];
  const empty = alpha(theme.palette.text.primary, 0.12);
  const fill = (level: ActivityLevel | null): string => (level === null ? empty : hues[level]);

  return (
    <Stack spacing={1}>
      <Box
        component="svg"
        role="img"
        aria-label={summary}
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        preserveAspectRatio="none"
        sx={{ width: '100%', height, display: 'block' }}
      >
        {bars.map((bar) => {
          const slot = bar.width * VIEW_WIDTH;
          const barHeight = Math.max(bar.value * height, MIN_BAR);
          return (
            <rect
              key={bar.key}
              x={bar.offset * VIEW_WIDTH + (slot * GAP) / 2}
              width={Math.max(slot * (1 - GAP), 2)}
              y={height - barHeight}
              height={barHeight}
              rx={2}
              fill={fill(bar.level)}
            />
          );
        })}
      </Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between' }} aria-hidden>
        <AxisLabel text={labels.start} />
        <AxisLabel text={labels.middle} />
        <AxisLabel text={labels.end} />
      </Stack>
    </Stack>
  );
}
