import { useNavigate } from 'react-router-dom';
import { Box } from '@exyconn/shell/components/ui';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  MaTranscriptSearchDocument,
  type MaTranscriptSearchQuery,
} from '@exyconn/shell/graphql/generated';
import type { TimedGridContext } from '../lib/columns';
import { meetingPaths, toMaScope, type MeetingPageProps } from '../lib/scope';
import { useScopedFetcher } from '../lib/useScopedFetcher';
import { TRANSCRIPT_HIT_COLUMNS, type TranscriptHit } from './transcript-hits-grid';

/** Meeting Assistant → Transcripts: search every line said in every meeting in scope. */
export function TranscriptsPage({ scope, basePath }: Readonly<MeetingPageProps>) {
  const navigate = useNavigate();
  const { formatDateTime } = useSettings();
  const paths = meetingPaths(basePath);
  const fetchRows = useScopedFetcher(
    MaTranscriptSearchDocument,
    (data: MaTranscriptSearchQuery) => data.maTranscriptSearch,
    { scope: toMaScope(scope) },
  );
  const context: TimedGridContext<TranscriptHit> = { actions: {}, formatDateTime };
  return (
    <>
      <PageHeader title="Transcripts" subtitle="Search what was said across meetings" />
      <Box sx={densePanel}>
        <ServerDataGrid<TranscriptHit>
          columnDefs={TRANSCRIPT_HIT_COLUMNS}
          fetchRows={fetchRows}
          context={context}
          onRowClick={(hit) => navigate(paths.transcript(hit.meetingId))}
          searchPlaceholder="Search transcripts…"
        />
      </Box>
    </>
  );
}
