import type { SvgIconComponent } from '@mui/icons-material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import KeyboardOutlined from '@mui/icons-material/KeyboardOutlined';
import MouseOutlined from '@mui/icons-material/MouseOutlined';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import type { TrackerState } from '@shared/types';
import GlassCard from '../components/GlassCard';
import StatTile from '../components/StatTile';
import StatusChip from '../components/StatusChip';
import SyncBar from '../components/SyncBar';
import TrackingControls from '../components/TrackingControls';
import { formatClock, formatCount } from '../format';

interface Tile {
  id: string;
  label: string;
  value: string;
  icon: SvgIconComponent;
}

function tiles(state: TrackerState): Tile[] {
  const { stats } = state;
  return [
    {
      id: 'worked',
      label: 'Worked',
      value: formatClock(stats.sessionActiveMs),
      icon: TimerOutlined,
    },
    {
      id: 'idle',
      label: 'Idle',
      value: formatClock(stats.sessionIdleMs),
      icon: HourglassEmptyOutlined,
    },
    {
      id: 'keys',
      label: 'Key presses',
      value: formatCount(stats.keyCount),
      icon: KeyboardOutlined,
    },
    {
      id: 'mouse',
      label: 'Mouse clicks',
      value: formatCount(stats.mouseCount),
      icon: MouseOutlined,
    },
    { id: 'app', label: 'Current app', value: stats.currentApp || '—', icon: AppsOutlined },
    {
      id: 'screenshots',
      label: 'Screenshots',
      value: formatCount(stats.screenshotCount),
      icon: PhotoCameraOutlined,
    },
  ];
}

interface Props {
  state: TrackerState;
}

/** Tracking controls, sync status and this session's live counters. */
export default function DashboardScreen({ state }: Readonly<Props>): JSX.Element {
  const { stats, status, settings, user } = state;

  return (
    <Stack spacing={2}>
      <GlassCard sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>
              {user?.name ?? 'Signed in'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              This session only — totals reset when you stop.
            </Typography>
          </Box>
          <StatusChip status={status} />
        </Stack>
        <TrackingControls status={status} />
      </GlassCard>

      <SyncBar stats={stats} settings={settings} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 1.5,
        }}
      >
        {tiles(state).map((tile) => (
          <StatTile key={tile.id} label={tile.label} value={tile.value} icon={tile.icon} />
        ))}
      </Box>
    </Stack>
  );
}
