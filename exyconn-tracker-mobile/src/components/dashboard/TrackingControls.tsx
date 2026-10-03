import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import type { TrackerStatus } from '@exyconn/tracker-core';
import { resumeTracking, tracker } from '../../tracker/instance';
import { usePendingAction } from '../../hooks/usePendingAction';
import { run } from '../../tracker/run';
import { AppButton } from '../ui/AppButton';
import { Notice } from '../ui/Notice';

type ControlAction = 'start' | 'pause' | 'resume' | 'stop';

/** What each button does, and the sentence shown when it fails without saying why. */
const ACTIONS: Readonly<Record<ControlAction, { run: () => Promise<unknown>; failed: string }>> = {
  start: { run: () => tracker.start(), failed: 'Could not start tracking.' },
  pause: { run: async () => tracker.pause(), failed: 'Could not pause tracking.' },
  // Not tracker.resume(): on Android the screen-capture grant the session needs may be gone.
  resume: { run: () => resumeTracking(), failed: 'Could not resume tracking.' },
  stop: { run: () => tracker.stop(), failed: 'Could not stop tracking.' },
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
 * flight shows a spinner and holds the others; a refusal (screen capture declined, attendance
 * not marked, the portal unreachable) is shown in the controller's own sentence.
 */
export function TrackingControls({ status, attendanceMarked }: Readonly<Props>) {
  const t = useT();
  const { pending, error, perform } = usePendingAction<ControlAction>();
  const isIdle = status === 'idle';
  const isTracking = status === 'tracking';
  const isPaused = status === 'paused';
  const locked = pending !== null;

  const press = (action: ControlAction) => () =>
    run(() => perform(action, ACTIONS[action].run, t(ACTIONS[action].failed)));

  return (
    <YStack gap="$3">
      <XStack gap="$2.5" flexWrap="wrap">
        <AppButton
          label={t('Start')}
          icon="play"
          disabled={!isIdle || !attendanceMarked || locked}
          busy={pending === 'start'}
          onPress={press('start')}
        />
        <AppButton
          label={t('Pause')}
          tone="outlined"
          icon="pause"
          disabled={!isTracking || locked}
          busy={pending === 'pause'}
          onPress={press('pause')}
        />
        <AppButton
          label={t('Resume')}
          tone="outlined"
          icon="replay"
          disabled={!isPaused || locked}
          busy={pending === 'resume'}
          onPress={press('resume')}
        />
        <AppButton
          label={t('Stop')}
          tone="outlined"
          icon="stop"
          danger
          disabled={(!isTracking && !isPaused) || locked}
          busy={pending === 'stop'}
          onPress={press('stop')}
        />
      </XStack>
      {error === null ? null : <Notice severity="error">{error}</Notice>}
    </YStack>
  );
}
