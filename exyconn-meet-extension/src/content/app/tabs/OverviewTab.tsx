import { Alert, Button, Stack } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import TuneIcon from '@mui/icons-material/Tune';
import { AccountCard } from '../../../components/AccountCard';
import { CaptureControls } from '../../../components/CaptureControls';
import { MeetingStatus } from '../../../components/MeetingStatus';
import { openTranscriptionControls } from '../../meet-adapter';
import { startRecording } from '../../recorder';
import { FollowUpCard } from './FollowUpCard';
import type { TabProps } from './types';

/** Meeting and capture status, the capture controls and the previous meeting's follow-up. */
export function OverviewTab({ state, tab, logger }: Readonly<TabProps>) {
  const t = useT();
  if (!state.auth.signedIn) {
    return <AccountCard auth={state.auth} logger={logger} onChanged={() => undefined} />;
  }
  const inCall = tab.meetingState === 'IN_MEETING';
  const showMeetControls = inCall && tab.transcriptionState !== 'ON';
  const openControls = (): void => {
    if (openTranscriptionControls(document) === 'NOT_FOUND') {
      logger.info('Meet transcription controls not found on the page');
    }
  };
  return (
    <Stack spacing={2}>
      <MeetingStatus tab={tab} />
      {showMeetControls ? (
        <Stack spacing={1}>
          <Alert severity="warning">
            {t(
              'Meeting transcription is off. Enable transcription to generate meeting notes and action items.',
            )}
          </Alert>
          <Button variant="outlined" startIcon={<TuneIcon />} onClick={openControls}>
            {t('Open transcription controls')}
          </Button>
        </Stack>
      ) : null}
      <CaptureControls
        tab={tab}
        logger={logger}
        onStart={(needsConsent) => startRecording(needsConsent, logger)}
      />
      <FollowUpCard enabled={tab.meetingId !== null} logger={logger} />
    </Stack>
  );
}
