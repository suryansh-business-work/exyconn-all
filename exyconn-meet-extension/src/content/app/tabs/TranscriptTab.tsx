import { useEffect, useRef } from 'react';
import { Box, Chip, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { PanelState } from '../PanelState';
import { usePanelQuery } from '../usePanelQuery';
import { groupBySpeaker, mergeLines } from './transcript/groups';
import { SpeakerBlock } from './transcript/SpeakerBlock';
import type { TabProps } from './types';

/** This browser's own fresh lines come from the worker's memory: cheap to ask for often. */
const LOCAL_POLL_MS = 3_000;
/** The portal's copy (other tabs, earlier lines) changes more slowly. */
const REMOTE_POLL_MS = 10_000;
/** Within this distance of the bottom the reader is following along, so new lines scroll in. */
const FOLLOW_SLACK_PX = 240;

/** Keeps the newest line in view while the reader is at the bottom; leaves them be otherwise. */
function useFollow(count: number) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = end.current?.closest('[role="tabpanel"]');
    if (box && box.scrollHeight - box.scrollTop - box.clientHeight < FOLLOW_SLACK_PX) {
      end.current?.scrollIntoView?.({ block: 'end' });
    }
  }, [count]);
  return end;
}

/**
 * The live transcript: lines this browser just uploaded, merged with the portal's, grouped by
 * speaker as they are spoken. Polled only while this tab of the panel is open. Never
 * invented: no audio, no lines.
 */
export function TranscriptTab({ state, tab, prefs, logger }: Readonly<TabProps>) {
  const t = useT();
  const allowed = prefs.liveTranscript && state.auth.org?.liveTranscript === true;
  const enabled = allowed && tab.meetingId !== null;
  const local = usePanelQuery({ op: 'liveSegments' }, enabled, LOCAL_POLL_MS, logger);
  const remote = usePanelQuery(
    { op: 'transcript', afterMs: null },
    enabled,
    REMOTE_POLL_MS,
    logger,
  );
  const groups = groupBySpeaker(mergeLines(local.data ?? [], remote.data ?? []));
  const end = useFollow(groups.length);

  if (!allowed) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('The live transcript is turned off in your settings or by your company.')}
      </Typography>
    );
  }
  return (
    <Stack spacing={2}>
      {tab.captureState === 'RECORDING' ? (
        <Chip
          size="small"
          color="error"
          icon={<FiberManualRecordIcon fontSize="small" />}
          label={t('Live')}
          sx={{ alignSelf: 'flex-start' }}
        />
      ) : null}
      <PanelState
        loading={local.loading || remote.loading}
        error={remote.error}
        empty={groups.length === 0}
        emptyText="No transcript yet. Lines appear here a few seconds after people speak, once transcription is running."
        onRetry={remote.reload}
      >
        <Stack
          component="ol"
          spacing={2}
          aria-live="polite"
          aria-label={t('Transcript')}
          sx={{ listStyle: 'none', m: 0, p: 0 }}
        >
          {groups.map((group) => (
            <SpeakerBlock key={group.id} group={group} />
          ))}
        </Stack>
      </PanelState>
      <Box ref={end} />
    </Stack>
  );
}
