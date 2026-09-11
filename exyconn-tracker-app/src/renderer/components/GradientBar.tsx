import type { ReactElement } from 'react';
import { alpha, Box, color, radius, trackerProgressGradient, Typography } from '@exyconn/ui';

/** Below this fill the inside label would be clipped, so it is left out. */
const LABEL_MIN_PERCENT = 30;
/** Past this fill the trailing text sits on the gradient, and takes the gradient's dark ink. */
const TRAILING_ON_FILL_PERCENT = 75;

interface Props {
  /** 0–100. */
  percent: number;
  /** Written inside the fill, e.g. "Worked". */
  label: string;
  /** Written at the right of the track, e.g. "of 8h 0m". */
  trailing: string;
  ariaLabel: string;
}

/**
 * A pill track filled coral → amber → green. The gradient spans the whole track, so how far
 * the fill has got also shows as its colour: a third of the way in is still coral.
 */
export default function GradientBar({
  percent,
  label,
  trailing,
  ariaLabel,
}: Readonly<Props>): ReactElement {
  const clamped = Math.min(100, Math.max(0, percent));
  const span = clamped > 0 ? (100 / clamped) * 100 : 100;
  return (
    <Box
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      sx={(theme) => ({
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        height: 44,
        borderRadius: `${radius.pill}px`,
        backgroundColor: alpha(theme.palette.text.primary, 0.06),
        overflow: 'hidden',
      })}
    >
      <Box
        sx={{
          width: `${clamped}%`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          borderRadius: `${radius.pill}px`,
          backgroundImage: `linear-gradient(90deg, ${trackerProgressGradient.join(', ')})`,
          backgroundSize: `${span}% 100%`,
          transition: 'width 400ms ease',
        }}
      >
        {clamped >= LABEL_MIN_PERCENT ? (
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: color.slate[900] }}>
            {label}
          </Typography>
        ) : null}
      </Box>
      <Box
        sx={{
          width: 3,
          height: 24,
          ml: 0.75,
          borderRadius: `${radius.pill}px`,
          backgroundColor: 'text.primary',
          flexShrink: 0,
        }}
      />
      <Typography
        variant="body2"
        noWrap
        sx={{
          position: 'absolute',
          right: 16,
          fontWeight: 600,
          color: clamped >= TRAILING_ON_FILL_PERCENT ? color.slate[900] : 'text.secondary',
        }}
      >
        {trailing}
      </Typography>
    </Box>
  );
}
