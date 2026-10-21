import { List, ListItem, ListItemText, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { LiveSegment } from '../../../types/meeting';
import { PanelState } from '../PanelState';
import { usePanelQuery } from '../usePanelQuery';
import type { TabProps } from './types';

/** How often the open transcript asks for new lines. */
const POLL_MS = 10_000;

/** mm:ss from the meeting start. */
function clock(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function merge(local: readonly LiveSegment[], remote: readonly LiveSegment[]): LiveSegment[] {
  const byId = new Map<string, LiveSegment>();
  for (const line of [...remote, ...local]) {
    byId.set(line.id, line);
  }
  return [...byId.values()].sort((a, b) => a.startMs - b.startMs);
}

/**
 * The live transcript: lines this browser just uploaded, merged with the portal's, polled
 * only while this tab of the panel is open. Never invented: no audio, no lines.
 */
export function TranscriptTab({ state, tab, prefs, logger }: Readonly<TabProps>) {
  const t = useT();
  const allowed = prefs.liveTranscript && state.auth.org?.liveTranscript === true;
  const enabled = allowed && tab.meetingId !== null;
  const local = usePanelQuery({ op: 'liveSegments' }, enabled, POLL_MS, logger);
  const remote = usePanelQuery({ op: 'transcript', afterMs: null }, enabled, POLL_MS, logger);
  const lines = merge(local.data ?? [], remote.data ?? []);

  if (!allowed) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('The live transcript is turned off in your settings or by your company.')}
      </Typography>
    );
  }
  return (
    <PanelState
      loading={local.loading || remote.loading}
      error={remote.error}
      empty={lines.length === 0}
      emptyText="No transcript yet. Lines appear here once transcription is running."
      onRetry={remote.reload}
    >
      <List dense aria-live="polite" aria-label={t('Transcript')}>
        {lines.map((line) => (
          <ListItem key={line.id} disableGutters>
            <ListItemText
              primary={line.text}
              secondary={
                line.speakerLabel === null
                  ? clock(line.startMs)
                  : `${clock(line.startMs)} · ${line.speakerLabel}`
              }
            />
          </ListItem>
        ))}
      </List>
    </PanelState>
  );
}
