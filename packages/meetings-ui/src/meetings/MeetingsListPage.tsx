import { useNavigate } from 'react-router-dom';
import { CrudDashboard, useCrudResource } from '@exyconn/crud';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  FilterOp,
  MaMeetingsPagedDocument,
  MaStepStatus,
  useMaDeleteMeetingMutation,
  type MaMeetingsPagedQuery,
  type TableFilterInput,
} from '@exyconn/shell/graphql/generated';
import type { TimedGridContext } from '../lib/columns';
import { meetingPaths, toMaScope, type MeetingPageProps } from '../lib/scope';
import { useScopedFetcher } from '../lib/useScopedFetcher';
import { MEETING_COLUMNS, type MeetingRow } from './meetings-grid';

interface MeetingsListPageProps extends MeetingPageProps {
  /** AI Notes: only the meetings whose summary has been written. */
  notesOnly?: boolean;
}

const NOTES_READY: readonly TableFilterInput[] = [
  { field: 'summaryStatus', op: FilterOp.Equals, value: MaStepStatus.Ready },
];
const NO_PRESET: readonly TableFilterInput[] = [];

/** Meeting Assistant → Meetings (or AI Notes): every recorded call, newest first. */
export function MeetingsListPage({
  scope,
  basePath,
  notesOnly = false,
}: Readonly<MeetingsListPageProps>) {
  const navigate = useNavigate();
  const { formatDateTime } = useSettings();
  const [deleteMeeting] = useMaDeleteMeetingMutation();
  const paths = meetingPaths(basePath);
  const resource = useCrudResource<MeetingRow>({
    label: 'Meeting',
    onDelete: (row) => deleteMeeting({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message:
        'Delete "{title}" with its transcript, notes, actions and emails? This cannot be undone.',
      values: { title: row.title },
    }),
  });
  const fetchRows = useScopedFetcher(
    MaMeetingsPagedDocument,
    (data: MaMeetingsPagedQuery) => data.maMeetingsPaged,
    { scope: toMaScope(scope) },
    notesOnly ? NOTES_READY : NO_PRESET,
  );
  const open = (row: MeetingRow) => navigate(paths.detail(row.id));
  const context: TimedGridContext<MeetingRow> = {
    actions: { open, delete: resource.remove },
    formatDateTime,
  };

  return (
    <CrudDashboard<MeetingRow, MeetingRow>
      title={notesOnly ? 'AI Notes' : 'Meetings'}
      subtitle={
        notesOnly
          ? 'Meetings whose AI summary is ready to read'
          : 'Every Google Meet call recorded with the extension'
      }
      entityLabel="meeting"
      stats={[]}
      refreshSignal={resource.refreshSignal}
      columnDefs={MEETING_COLUMNS}
      fetchRows={fetchRows}
      context={context}
      onRowClick={open}
      exportFileName={notesOnly ? 'meeting-notes' : 'meetings'}
      searchPlaceholder="Search by title, meeting code or organizer…"
    />
  );
}
