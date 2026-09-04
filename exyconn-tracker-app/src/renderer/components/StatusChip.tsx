import type { ReactElement } from 'react';
import { Box, Chip, alpha } from '@exyconn/ui';
import type { TrackerStatus } from '@shared/types';

type StatusTone = 'idle' | 'live' | 'paused';

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const STATUS_META: Record<TrackerStatus, StatusMeta> = {
  'signed-out': { label: 'Signed out', tone: 'idle' },
  'consent-required': { label: 'Consent required', tone: 'idle' },
  idle: { label: 'Not tracking', tone: 'idle' },
  tracking: { label: 'Tracking…', tone: 'live' },
  paused: { label: 'Paused', tone: 'paused' },
};

const TONE_COLOR: Record<StatusTone, string> = {
  idle: '#94A3B8',
  live: '#22C55E',
  paused: '#F59E0B',
};

interface DotProps {
  color: string;
  pulsing: boolean;
}

/** The status dot — it breathes only while tracking is actually running. */
function StatusDot({ color, pulsing }: Readonly<DotProps>): ReactElement {
  return (
    <Box
      sx={{
        // 8px wide, so the 50% radius is exactly 4px — the app-wide ceiling.
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 0 0 ${alpha(color, 0.7)}`,
        animation: pulsing ? 'trackerPulse 1.6s ease-out infinite' : 'none',
        '@keyframes trackerPulse': {
          '0%': { boxShadow: `0 0 0 0 ${alpha(color, 0.65)}` },
          '70%': { boxShadow: `0 0 0 8px ${alpha(color, 0)}` },
          '100%': { boxShadow: `0 0 0 0 ${alpha(color, 0)}` },
        },
      }}
    />
  );
}

interface Props {
  status: TrackerStatus;
}

/** Status pill with a pulsing dot. */
export default function StatusChip({ status }: Readonly<Props>): ReactElement {
  const meta = STATUS_META[status];
  const color = TONE_COLOR[meta.tone];

  return (
    <Chip
      icon={<StatusDot color={color} pulsing={meta.tone === 'live'} />}
      label={meta.label}
      sx={(theme) => ({
        pl: 1,
        height: 30,
        position: 'relative',
        top: '-12px',
        color: theme.palette.text.primary,
        backgroundColor: alpha(color, 0.16),
        border: `1px solid ${alpha(color, 0.4)}`,
        '& .MuiChip-icon': { ml: 0.5, mr: -0.25 },
      })}
    />
  );
}
