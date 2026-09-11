import type { ReactElement } from 'react';
import { alpha, Box, radius, trackerActivity, useTheme } from '@exyconn/ui';
import type { ChangeDirection, ChangeLabel } from '@exyconn/tracker-core';

/** Up reads as the high activity hue, down as the low one; no change stays neutral. */
function hueOf(
  direction: ChangeDirection,
  hues: { low: string; high: string },
  flat: string,
): string {
  if (direction === 'up') {
    return hues.high;
  }
  return direction === 'down' ? hues.low : flat;
}

/** "+12%" in a small tinted pill beside a figure — this period against the one before. */
export default function ChangeBadge({ change }: Readonly<{ change: ChangeLabel }>): ReactElement {
  const theme = useTheme();
  const hue = hueOf(
    change.direction,
    trackerActivity[theme.palette.mode],
    theme.palette.text.secondary,
  );
  return (
    <Box
      component="span"
      sx={{
        px: 0.75,
        py: 0.25,
        borderRadius: `${radius.pill}px`,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 700,
        color: hue,
        backgroundColor: alpha(hue, 0.14),
        whiteSpace: 'nowrap',
      }}
    >
      {change.text}
    </Box>
  );
}
