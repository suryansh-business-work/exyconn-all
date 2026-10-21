import { Alert, Button, Stack } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { Logger } from '@exyconn/logger';
import { askWorker } from '../../services/messaging';
import type { ReminderAction } from '../../utils/reminders';
import { openTranscriptionControls } from '../meet-adapter';
import { CONTROL_BAR_CLEARANCE } from '../../utils/floating-position';
import { logTo } from '../../services/logger';

interface Props {
  snoozeMinutes: number;
  logger: Logger;
}

/**
 * The in-meeting reminder, announced to screen readers. "Open transcription controls" only
 * brings Meet's own control into view — it never switches transcription on by itself.
 */
export function ReminderBanner({ snoozeMinutes, logger }: Readonly<Props>) {
  const t = useT();
  const choose = (action: ReminderAction) => (): void => {
    askWorker({ type: 'reminder/action', action }).catch(logTo(logger, 'Reminder action failed'));
  };
  const openControls = (): void => {
    if (openTranscriptionControls(document) === 'NOT_FOUND') {
      logger.info('Meet transcription controls not found on the page');
    }
  };
  const openSettings = (): void => {
    askWorker({ type: 'options/open' }).catch(logTo(logger, 'Could not open settings'));
  };

  return (
    <Alert
      role="alert"
      severity="warning"
      sx={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: CONTROL_BAR_CLEARANCE,
        maxWidth: 560,
      }}
    >
      <Stack spacing={1}>
        {t(
          'Meeting transcription is off. Enable transcription to generate meeting notes and action items.',
        )}
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button size="small" variant="contained" onClick={openControls}>
            {t('Open transcription controls')}
          </Button>
          <Button size="small" onClick={choose('LATER')}>
            {t('Remind later')}
          </Button>
          <Button size="small" onClick={choose('SNOOZE')}>
            {t('Snooze for {minutes} minutes', { minutes: snoozeMinutes })}
          </Button>
          <Button size="small" onClick={choose('DISMISS')}>
            {t('Dismiss for this meeting')}
          </Button>
          <Button size="small" onClick={openSettings}>
            {t('Settings')}
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
}
