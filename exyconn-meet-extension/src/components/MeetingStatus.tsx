import { Chip, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { TabSnapshot } from '../types/messages';
import { CAPTURE_LABEL, MEETING_STATE_LABEL, TRANSCRIPTION_LABEL } from './labels';

/**
 * The tab's meeting, Meet-transcription and capture state, announced politely when it
 * changes. While capturing, a "Recording" chip is the visible indicator — never silent.
 */
export function MeetingStatus({ tab }: Readonly<{ tab: TabSnapshot }>) {
  const t = useT();
  const recording = tab.captureState === 'RECORDING';
  return (
    <Stack spacing={1} role="status" aria-live="polite">
      <Typography variant="body2">{t(MEETING_STATE_LABEL[tab.meetingState])}</Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Chip size="small" label={t(TRANSCRIPTION_LABEL[tab.transcriptionState])} />
        <Chip
          size="small"
          color={recording ? 'error' : 'default'}
          icon={recording ? <FiberManualRecordIcon fontSize="small" /> : undefined}
          label={recording ? t('Recording') : t(CAPTURE_LABEL[tab.captureState])}
        />
        {tab.pendingUploads > 0 ? (
          <Chip
            size="small"
            color="info"
            label={t('Uploading {count} recording chunks', { count: tab.pendingUploads })}
          />
        ) : null}
      </Stack>
    </Stack>
  );
}
