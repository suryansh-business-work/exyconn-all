import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  DELETE_ACTION,
  EDIT_ACTION,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type {
  ListEmailFragmentsPagedQuery,
  ListEmailTemplatesPagedQuery,
  ListEmailLogsPagedQuery,
} from '@exyconn/shell/graphql/generated';

export type PagedFragmentRow =
  ListEmailFragmentsPagedQuery['listEmailFragmentsPaged']['rows'][number];
export type PagedTemplateRow =
  ListEmailTemplatesPagedQuery['listEmailTemplatesPaged']['rows'][number];
export type PagedLogRow = ListEmailLogsPagedQuery['listEmailLogsPaged']['rows'][number];

export type EmailGridContext = DatedCrudGridContext<PagedTemplateRow>;
export type FragmentGridContext = DatedCrudGridContext<PagedFragmentRow>;

/** The key is the contract between the codebase and the copy, so it leads the row. */
export const FRAGMENT_COLUMNS: ColDef<PagedFragmentRow>[] = [
  textColumn('key', 'Key'),
  textColumn('name', 'Name'),
  textColumn('description', 'Description'),
  dateColumn('updatedAt', 'Updated'),
  actionsColumn(),
];

/** Preview leads the row: it is what an author reaches for on every edit. */
const PREVIEW_ACTION = { key: 'preview', label: 'preview', icon: VisibilityIcon };

/** Renaming a template key breaks whatever sends it, which is why it is shown first. */
export const TEMPLATE_COLUMNS: ColDef<PagedTemplateRow>[] = [
  textColumn('key', 'Key'),
  textColumn('name', 'Name'),
  textColumn('subject', 'Subject'),
  derivedColumn('variables', 'Variables', (row) =>
    row.variables.length > 0 ? row.variables.join(', ') : '—',
  ),
  boolColumn('isActive', 'Active'),
  actionsColumn<PagedTemplateRow>([PREVIEW_ACTION, EDIT_ACTION, DELETE_ACTION]),
];

/** Logs are written by the send path, so there is nothing to edit or delete here. */
export const LOG_COLUMNS: ColDef<PagedLogRow>[] = [
  dateColumn('sentAt', 'When'),
  statusColumn('status', 'Status'),
  textColumn('templateName', 'Template'),
  textColumn('to', 'To'),
  textColumn('subject', 'Subject'),
  textColumn('error', 'Failure reason'),
];
