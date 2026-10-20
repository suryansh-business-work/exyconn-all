import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import {
  MaSummaryStyle,
  useMaNotesQuery,
  type MaMeetingDetailFragment,
} from '@exyconn/shell/graphql/generated';
import { NotesForm } from '../../forms/notes';
import { RegenerateNotesForm } from '../../forms/regenerate-notes';
import { LoadError } from '../../lib/LoadError';
import { NotesRevisions } from '../../notes/NotesRevisions';
import { NotesView } from '../../notes/NotesView';
import { NoNotes } from './NoNotes';
import { NotesToolbar, type NotesVersion } from './NotesToolbar';

/** What a regeneration offers when the meeting has no notes to take a style from. */
const DEFAULT_STYLE = MaSummaryStyle.Detailed;

/** The AI notes: read the current or original version, edit, regenerate, export. */
export function SummaryTab({ meeting }: Readonly<{ meeting: MaMeetingDetailFragment }>) {
  const t = useT();
  const { data, error, refetch } = useMaNotesQuery({
    variables: { meetingId: meeting.id },
    fetchPolicy: 'cache-and-network',
  });
  const [version, setVersion] = useState<NotesVersion>('current');
  const [editing, setEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const notes = data?.maNotes;
  const reload = () => refetch();

  let body;
  if (error) {
    body = <LoadError message={error.message} onRetry={reload} />;
  } else if (!data) {
    body = <PanelSkeleton />;
  } else if (!notes) {
    body = <NoNotes meeting={meeting} onRegenerate={() => setRegenerating(true)} />;
  } else if (editing) {
    body = (
      <NotesForm
        meetingId={meeting.id}
        notes={notes}
        onDone={() => setEditing(false)}
        onCancel={() => setEditing(false)}
        onReload={() => {
          setEditing(false);
          reload().catch((error: unknown) =>
            portalLogger.warn('Could not reload the meeting notes', error),
          );
        }}
      />
    );
  } else {
    const shown = version === 'current' ? notes.content : notes.original;
    body = (
      <>
        <NotesToolbar
          notes={notes}
          title={meeting.title}
          shown={shown}
          version={version}
          onVersion={setVersion}
          onEdit={() => setEditing(true)}
          onRegenerate={() => setRegenerating(true)}
        />
        <NotesView content={shown} />
        <NotesRevisions revisions={notes.revisions} />
      </>
    );
  }

  return (
    <Box sx={panel}>
      {body}
      <CrudDialog
        open={regenerating}
        title={t('Regenerate notes')}
        onClose={() => setRegenerating(false)}
      >
        <RegenerateNotesForm
          meetingId={meeting.id}
          style={notes?.style ?? DEFAULT_STYLE}
          onDone={() => setRegenerating(false)}
          onCancel={() => setRegenerating(false)}
        />
      </CrudDialog>
    </Box>
  );
}
