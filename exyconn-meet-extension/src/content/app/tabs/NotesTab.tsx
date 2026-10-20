import { Link, List, ListItem, ListItemText, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { MaStepStatus } from '../../../graphql/generated';
import { PORTAL_MEETINGS_PATH, PORTAL_URL } from '../../../config';
import { PanelState } from '../PanelState';
import { usePanelQuery } from '../usePanelQuery';
import type { TabProps } from './types';

const POLL_MS = 30_000;

/** What to say while there are no notes, by the pipeline's state. */
const WAITING: Readonly<Record<MaStepStatus, string>> = {
  NOT_STARTED: 'Notes are written after the meeting ends.',
  QUEUED: 'The notes are queued and will appear shortly.',
  RUNNING: 'The notes are being written…',
  READY: 'No notes were produced for this meeting.',
  FAILED: 'The notes could not be generated. Open the portal to try again.',
  SKIPPED: 'Notes were not generated for this meeting.',
};

function Section({ title, items }: Readonly<{ title: string; items: readonly string[] }>) {
  const t = useT();
  if (items.length === 0) {
    return null;
  }
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" component="h3">
        {t(title)}
      </Typography>
      <List dense disablePadding>
        {items.map((item) => (
          <ListItem key={item} disableGutters>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}

/** The AI notes and decisions, once the portal has them; a link to the full page. */
export function NotesTab({ state, tab, logger }: Readonly<TabProps>) {
  const t = useT();
  const query = usePanelQuery({ op: 'notes' }, tab.meetingId !== null, POLL_MS, logger);
  const notes = query.data?.maNotes ?? null;
  const decisions = (query.data?.maDecisions ?? []).map((decision) => decision.text);
  const status = query.data?.maMeeting.summaryStatus ?? 'NOT_STARTED';
  const base = state.auth.org?.portalUrl ?? PORTAL_URL;
  const portal = tab.meetingId === null ? null : `${base}${PORTAL_MEETINGS_PATH}/${tab.meetingId}`;
  return (
    <Stack spacing={2}>
      <PanelState
        loading={query.loading}
        error={query.error}
        empty={notes === null}
        emptyText={WAITING[status]}
        onRetry={query.reload}
      >
        {notes === null ? null : (
          <Stack spacing={1.5}>
            <Typography variant="body2">{notes.content.overview}</Typography>
            <Section title="Discussion" items={notes.content.discussionPoints} />
            <Section title="Decisions" items={decisions} />
            <Section title="Follow-ups" items={notes.content.followUps} />
          </Stack>
        )}
      </PanelState>
      {portal === null ? null : (
        <Link href={portal} target="_blank" rel="noopener noreferrer">
          {t('Open the meeting in the portal')}
        </Link>
      )}
    </Stack>
  );
}
