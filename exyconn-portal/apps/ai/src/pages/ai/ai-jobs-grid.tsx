import type { ColDef } from 'ag-grid-community';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListAiJobsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedAiJobRow = ListAiJobsPagedQuery['listAiJobsPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type AiJobsGridContext = DatedCrudGridContext<PagedAiJobRow>;

const RUN_ACTION: RowActionSpec = {
  key: 'run',
  label: 'run job',
  icon: PlayArrowIcon,
  color: 'primary',
  // A job already waiting or in flight would be sent to OpenAI twice.
  hidden: (row: PagedAiJobRow) =>
    row.status === 'RUNNING' || (row.status === 'QUEUED' && Boolean(row.queuedAt)),
};

const VIEW_ACTION: RowActionSpec = { key: 'view', label: 'view result', icon: VisibilityIcon };

/** Cheap runs are fractions of a cent, so the column needs more than two decimals. */
const COST_DIGITS = 4;

/** What one run cost. A model with no price on file reads as a dash, never as $0.00. */
export function formatCostUsd(costUsd: number, hasRun: boolean): string {
  if (!hasRun || costUsd === 0) {
    return '—';
  }
  return `$${costUsd.toFixed(COST_DIGITS)}`;
}

/** Column model for the server-side AI Jobs grid. Name and Model hit the server filter. */
export const AI_JOB_COLUMNS: ColDef<PagedAiJobRow>[] = [
  textColumn('name', 'Name'),
  textColumn('model', 'Model'),
  statusColumn('status', 'Status'),
  textColumn('createdByName', 'Run by', (row) => row.createdByName || '—'),
  valueColumn('totalTokens', 'Tokens', (row) => row.totalTokens.toLocaleString()),
  valueColumn('costUsd', 'Cost', (row) => formatCostUsd(row.costUsd, Boolean(row.ranAt))),
  dateColumn('ranAt', 'Last run', '—'),
  actionsColumn([RUN_ACTION, VIEW_ACTION, EDIT_ACTION, DELETE_ACTION], 150),
];
