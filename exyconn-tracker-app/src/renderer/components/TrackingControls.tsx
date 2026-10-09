import type { ReactElement } from 'react';
import { Alert, Button, Stack, TRACKER_RADIUS } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import type { TrackerStatus } from '@shared/types';
import usePendingAction from '../hooks/usePendingAction';
import { useAnnounce } from '../a11y/LiveAnnouncer';
import { run } from '../run';

type ControlAction = 'start' | 'pause' | 'resume' | 'stop';

/** What each button does, and the sentence shown when it fails without saying why. */
const ACTIONS: Readonly<Record<ControlAction, { run: () => Promise<unknown>; failed: string }>> = {
  start: { run: () => globalThis.tracker.start(), failed: 'Could not start tracking.' },
  pause: { run: () => globalThis.tracker.pause(), failed: 'Could not pause tracking.' },
  resume: { run: () => globalThis.tracker.resume(), failed: 'Could not resume tracking.' },
  stop: { run: () => globalThis.tracker.stop(), failed: 'Could not stop tracking.' },
};

interface Props {
  status: TrackerStatus;
  /**
   * Whether the employee has marked themselves in today. Start stays disabled until they
   * have — the portal refuses to open a session either way, and a button that fails is worse
   * than one that plainly cannot be pressed yet.
   */
  attendanceMarked: boolean;
}

/**
 * Start / Pause / Resume / Stop — each enabled only in the status where it applies. The one in
 * flight shows a spinner and holds the others; a refusal (attendance not marked, the portal
 * unreachable) is shown in the controller's own sentence.
 */
export default function TrackingControls({
  status,
  attendanceMarked,
}: Readonly<Props>): ReactElement {
  const t = useT();
  const { pending, error, perform } = usePendingAction<ControlAction>();
  useAnnounce(error, 'assertive');
  const isIdle = status === 'idle';
  const isTracking = status === 'tracking';
  const isPaused = status === 'paused';
  const locked = pending !== null;

  const press = (action: ControlAction) => () =>
    run(() => perform(action, ACTIONS[action].run, t(ACTIONS[action].failed)));

  return (
    <Stack spacing={1.25}>
      <Stack
        direction="row"
        spacing={1.25}
        useFlexGap
        sx={{
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="contained"
          startIcon={<PlayArrowRounded />}
          loading={pending === 'start'}
          disabled={!isIdle || !attendanceMarked || locked}
          onClick={press('start')}
        >
          {t('Start')}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<PauseRounded />}
          loading={pending === 'pause'}
          disabled={!isTracking || locked}
          onClick={press('pause')}
        >
          {t('Pause')}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<ReplayRounded />}
          loading={pending === 'resume'}
          disabled={!isPaused || locked}
          onClick={press('resume')}
        >
          {t('Resume')}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<StopRounded />}
          loading={pending === 'stop'}
          disabled={(!isTracking && !isPaused) || locked}
          onClick={press('stop')}
        >
          {t('Stop')}
        </Button>
      </Stack>
      {error !== null && (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
          {error}
        </Alert>
      )}
    </Stack>
  );
}
