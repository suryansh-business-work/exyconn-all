import type { ReactElement } from 'react';
import { Box, Tooltip, keyframes } from '@exyconn/ui';
import type { TrackerStatus } from '@shared/types';

/**
 * A slow, calm heartbeat — not a blink. This sits in the header for the whole working day,
 * and anything faster reads as an alarm rather than as "recording".
 */
const pulse = keyframes`
  0%   { transform: scale(1);   opacity: 1; }
  70%  { transform: scale(2.4); opacity: 0; }
  100% { transform: scale(2.4); opacity: 0; }
`;

/** What the dot means, per status. `signed-out` never reaches the header. */
const LOOK: Record<TrackerStatus, { color: string; label: string; live: boolean }> = {
  'signed-out': { color: 'text.disabled', label: 'Signed out', live: false },
  'consent-required': { color: 'warning.main', label: 'Waiting for your consent', live: false },
  idle: { color: 'text.disabled', label: 'Not tracking — nothing is being recorded', live: false },
  tracking: { color: 'success.main', label: 'Tracking — recording your work', live: true },
  paused: { color: 'warning.main', label: 'Paused — nothing is being recorded', live: false },
};

interface Props {
  status: TrackerStatus;
}

/**
 * The always-visible answer to "is it recording right now?".
 *
 * The tray icon already promises the app is never hidden; this makes the same promise inside
 * the window, on every page. Only `tracking` animates — a dot that pulses while paused would
 * say the opposite of the truth, which is the one thing a monitoring app cannot afford.
 */
export default function TrackingPulse({ status }: Readonly<Props>): ReactElement {
  const look = LOOK[status];

  return (
    <Tooltip title={look.label}>
      <Box
        aria-label={look.label}
        sx={{ position: 'relative', display: 'grid', placeItems: 'center', width: 14, height: 14 }}
      >
        {look.live ? (
          <Box
            sx={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: look.color,
              animation: `${pulse} 2s ease-out infinite`,
              // A ring expanding out of the dot; it must not intercept the drag region.
              pointerEvents: 'none',
            }}
          />
        ) : null}
        <Box
          sx={{
            position: 'relative',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: look.color,
          }}
        />
      </Box>
    </Tooltip>
  );
}
