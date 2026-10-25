import { useState } from 'react';
import { Alert, Button, Stack } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { Logger } from '@exyconn/logger';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { askWorker } from '../services/messaging';
import type { TabSnapshot } from '../types/messages';
import { ConsentDialog } from './ConsentDialog';
import { useCaptureActions } from './useCaptureActions';
import { logTo } from '../services/logger';

interface Props {
  tab: TabSnapshot;
  /** The popup names its tab; the in-Meet panel speaks for its own (undefined). */
  tabId?: number;
  logger: Logger;
  /**
   * Starts recording, recording consent first when asked. Only the in-Meet panel has it:
   * Chrome's "Share this tab" dialog must open from a click in the Meet page itself.
   */
  onStart?: (needsConsent: boolean) => Promise<void>;
}

type WorkerAction = 'capture/pause' | 'capture/resume' | 'capture/stop';

/** Which buttons the capture state offers. */
function offered(tab: TabSnapshot): {
  start: boolean;
  pause: boolean;
  resume: boolean;
  stop: boolean;
} {
  const state = tab.captureState;
  return {
    start: state === 'IDLE' || state === 'STOPPED' || state === 'ERROR',
    pause: state === 'RECORDING',
    resume: state === 'PAUSED',
    stop: state === 'RECORDING' || state === 'PAUSED',
  };
}

/**
 * Start / pause / resume / stop. Starting always goes through the consent dialog first
 * unless consent for this call is already on record — recording never starts unasked.
 */
export function CaptureControls({ tab, tabId, logger, onStart }: Readonly<Props>) {
  const t = useT();
  const { busy, error, run } = useCaptureActions(logger);
  const [consentOpen, setConsentOpen] = useState(false);
  const show = offered(tab);
  const blocked =
    tab.meetingId === null || tab.meetingState !== 'IN_MEETING' || tab.captureElsewhere;

  const begin = (needsConsent: boolean): void => {
    if (onStart === undefined) {
      return;
    }
    run('start', () => onStart(needsConsent))
      .then((started) => {
        if (started) {
          setConsentOpen(false);
        }
      })
      .catch(logTo(logger, 'Start failed', 'error'));
  };
  const start = (): void => {
    if (tab.consentRecorded) {
      begin(false);
    } else {
      setConsentOpen(true);
    }
  };
  const send = (type: WorkerAction) => (): void => {
    run(type, () => askWorker({ type, tabId })).catch(
      logTo(logger, 'Capture action failed', 'error'),
    );
  };

  const shownError = error ?? tab.captureError;
  const severity = tab.captureState === 'ERROR' || error !== null ? 'error' : 'info';
  return (
    <Stack spacing={1}>
      {tab.captureElsewhere ? (
        <Alert severity="info">{t('This call is already being transcribed in another tab')}</Alert>
      ) : null}
      {shownError === null ? null : <Alert severity={severity}>{t(shownError)}</Alert>}
      {show.start && onStart === undefined ? (
        <Alert severity="info">
          {t('Start transcription from the assistant panel in your Google Meet tab')}
        </Alert>
      ) : null}
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {show.start && onStart !== undefined ? (
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={start}
            disabled={busy || blocked}
          >
            {t('Start transcription')}
          </Button>
        ) : null}
        {show.pause ? (
          <Button
            variant="outlined"
            startIcon={<PauseIcon />}
            onClick={send('capture/pause')}
            disabled={busy}
          >
            {t('Pause')}
          </Button>
        ) : null}
        {show.resume ? (
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={send('capture/resume')}
            disabled={busy}
          >
            {t('Resume')}
          </Button>
        ) : null}
        {show.stop ? (
          <Button
            variant="outlined"
            color="error"
            startIcon={<StopIcon />}
            onClick={send('capture/stop')}
            disabled={busy}
          >
            {t('Stop')}
          </Button>
        ) : null}
      </Stack>
      <ConsentDialog
        open={consentOpen}
        busy={busy}
        onConfirm={() => begin(true)}
        onCancel={() => setConsentOpen(false)}
      />
    </Stack>
  );
}
