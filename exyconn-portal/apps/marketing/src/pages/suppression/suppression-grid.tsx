import type { ColDef } from 'ag-grid-community';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  derivedStatusColumn,
  emailColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListMarketingSuppressionsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedSuppressionRow =
  ListMarketingSuppressionsPagedQuery['listMarketingSuppressionsPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type SuppressionGridContext = DatedCrudGridContext<PagedSuppressionRow>;

const isArchived = (row: PagedSuppressionRow) => Boolean(row.archivedAt);

const ACTIONS: RowActionSpec[] = [
  { key: 'details', label: 'view details', icon: InfoOutlinedIcon, color: 'primary' },
  { key: 'note', label: 'edit note', icon: EditNoteIcon },
  {
    key: 'archive',
    label: 'archive',
    icon: ArchiveOutlinedIcon,
    hidden: (row: PagedSuppressionRow) => isArchived(row),
  },
  {
    key: 'unarchive',
    label: 'unarchive',
    icon: UnarchiveOutlinedIcon,
    hidden: (row: PagedSuppressionRow) => !isArchived(row),
  },
  { key: 'remove', label: 'remove suppression', icon: RemoveCircleOutlinedIcon, color: 'error' },
];

/** "Priya Shah (contact), Urban Café (company)", or a dash for an address nobody holds. */
const linkedNames = (row: PagedSuppressionRow): string =>
  (row.linkedRecords ?? []).map((link) => `${link.name} (${link.kind.toLowerCase()})`).join(', ') ||
  '—';

/**
 * Column model for the suppression list. The reason and origin record what happened, so
 * there is no edit form — only the note changes, and removal is its own justified action.
 */
export const SUPPRESSION_COLUMNS: ColDef<PagedSuppressionRow>[] = [
  emailColumn('email', 'Email'),
  statusColumn('reason', 'Reason'),
  statusColumn('origin', 'Source'),
  derivedColumn('linkedRecords', 'Linked contact / company', linkedNames),
  statusColumn('scope', 'Scope'),
  derivedStatusColumn('status', 'Status', (row) => (isArchived(row) ? 'ARCHIVED' : 'ACTIVE')),
  dateColumn('createdAt', 'Added on'),
  textColumn('addedByName', 'Added by', (row) => row.addedByName || '—'),
  textColumn('note', 'Note', (row) => row.note || '—'),
  actionsColumn(ACTIONS),
];
