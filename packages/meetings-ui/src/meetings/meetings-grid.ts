import type { ColDef } from 'ag-grid-community';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  DELETE_ACTION,
  actionsColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type RowActionSpec,
} from '@exyconn/crud';
import type { MaMeetingRowFragment } from '@exyconn/shell/graphql/generated';
import { dateTimeColumn } from '../lib/columns';
import { formatSeconds } from '../lib/format';

export type MeetingRow = MaMeetingRowFragment;

const OPEN_ACTION: RowActionSpec = { key: 'open', label: 'open meeting', icon: OpenInNewIcon };

/** The meetings register. Title, organizer and code hit the server search and filters. */
export const MEETING_COLUMNS: ColDef<MeetingRow>[] = [
  { ...textColumn<MeetingRow>('title', 'Meeting Title'), flex: 1, minWidth: 220 },
  dateTimeColumn<MeetingRow>('startedAt', 'Date'),
  valueColumn<MeetingRow>('durationSeconds', 'Duration', (row) =>
    formatSeconds(row.durationSeconds),
  ),
  textColumn<MeetingRow>('ownerName', 'Organizer'),
  valueColumn<MeetingRow>('participantCount', 'Participants', (row) =>
    String(row.participantCount),
  ),
  statusColumn<MeetingRow>('transcriptionState', 'Transcript Status'),
  statusColumn<MeetingRow>('summaryStatus', 'AI Summary Status'),
  valueColumn<MeetingRow>('actionItemCount', 'Action Items', (row, t) =>
    t('{open} open of {total}', { open: row.openActionCount, total: row.actionItemCount }),
  ),
  statusColumn<MeetingRow>('emailStatus', 'Email Status'),
  actionsColumn<MeetingRow>([OPEN_ACTION, DELETE_ACTION]),
];
