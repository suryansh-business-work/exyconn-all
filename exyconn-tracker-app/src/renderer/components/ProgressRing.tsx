import type { ReactElement } from 'react';
import { Box, CircularProgress, Typography, alpha } from '@exyconn/ui';

interface Props {
  /** 0-100. Anything outside is clamped by the caller, not here. */
  value: number;
  /** The figure drawn in the middle — the thing the ring is about, not a repeat of the number. */
  label: string;
  /** One line under it, when the figure needs saying in words. */
  caption?: string;
  color: 'primary' | 'success';
  size?: number;
}

/**
 * A determinate ring with the figure in the middle of it.
 *
 * Two circles, not one: MUI's determinate progress draws only the filled arc, so without a
 * full-circle track underneath there is nothing to read the arc AGAINST — 20% and 80% look
 * like two unrelated shapes rather than two positions on the same journey.
 *
 * `role="img"` with a spoken label: a ring is a picture of a number, and a screen reader
 * that announced "progressbar, 62" would leave out what the 62 is of.
 */
export default function ProgressRing({
  value,
  label,
  caption,
  color,
  size = 116,
}: Readonly<Props>): ReactElement {
  return (
    <Box
      role="img"
      aria-label={caption ? `${label}. ${caption}` : label}
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={4}
        sx={(theme) => ({
          position: 'absolute',
          color: alpha(theme.palette.text.primary, 0.12),
        })}
      />
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        thickness={4}
        color={color}
        // The arc starts at the top and runs clockwise, like a clock — the default starts at
        // three o'clock, which reads as a slice of a pie rather than progress through a day.
        sx={{ position: 'absolute', '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
      />
      <Box sx={{ textAlign: 'center', px: 1 }}>
        <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
          {label}
        </Typography>
        {caption !== undefined && caption !== '' ? (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              display: "block"
            }}>
            {caption}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
