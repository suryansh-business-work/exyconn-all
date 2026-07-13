import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import type { TrackerStatus } from '@shared/types';
import { run } from '../run';

interface Props {
  status: TrackerStatus;
}

/** Start / Pause / Resume / Stop — each enabled only in the status where it applies. */
export default function TrackingControls({ status }: Readonly<Props>): JSX.Element {
  const isIdle = status === 'idle';
  const isTracking = status === 'tracking';
  const isPaused = status === 'paused';

  return (
    <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
      <Button
        variant="contained"
        startIcon={<PlayArrowRounded />}
        disabled={!isIdle}
        onClick={() => run(() => window.tracker.start())}
      >
        Start
      </Button>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<PauseRounded />}
        disabled={!isTracking}
        onClick={() => run(() => window.tracker.pause())}
      >
        Pause
      </Button>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<ReplayRounded />}
        disabled={!isPaused}
        onClick={() => run(() => window.tracker.resume())}
      >
        Resume
      </Button>
      <Button
        variant="outlined"
        color="error"
        startIcon={<StopRounded />}
        disabled={!isTracking && !isPaused}
        onClick={() => run(() => window.tracker.stop())}
      >
        Stop
      </Button>
    </Stack>
  );
}
