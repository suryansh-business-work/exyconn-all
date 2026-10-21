import { useNavigate } from 'react-router-dom';
import { Box } from '@exyconn/shell/components/ui';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  MaParticipantsPagedDocument,
  type MaParticipantsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import type { TimedGridContext } from '../lib/columns';
import { meetingPaths, toMaScope, type MeetingPageProps } from '../lib/scope';
import { useScopedFetcher } from '../lib/useScopedFetcher';
import type { ParticipantRow } from './participant-attendance';
import { PARTICIPANT_COLUMNS } from './participants-grid';

/** Meeting Assistant → Participants: who attended which call, and for how long. */
export function ParticipantsPage({ scope, basePath }: Readonly<MeetingPageProps>) {
  const navigate = useNavigate();
  const { formatDateTime } = useSettings();
  const paths = meetingPaths(basePath);
  const fetchRows = useScopedFetcher(
    MaParticipantsPagedDocument,
    (data: MaParticipantsPagedQuery) => data.maParticipantsPaged,
    { scope: toMaScope(scope) },
  );
  const context: TimedGridContext<ParticipantRow> = { actions: {}, formatDateTime };
  return (
    <>
      <PageHeader
        title="Participants"
        subtitle="Names read from the Meet window are a best effort; verified emails come from Google"
      />
      <Box sx={densePanel}>
        <ServerDataGrid<ParticipantRow>
          columnDefs={PARTICIPANT_COLUMNS}
          fetchRows={fetchRows}
          context={context}
          onRowClick={(row) => navigate(`${paths.detail(row.meetingId)}/participants`)}
          searchPlaceholder="Search by name or email…"
        />
      </Box>
    </>
  );
}
