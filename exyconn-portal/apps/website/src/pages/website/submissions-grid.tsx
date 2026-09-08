import type { ColDef } from 'ag-grid-community';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListWebsiteSubmissionsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedSubmissionRow =
  ListWebsiteSubmissionsPagedQuery['listWebsiteSubmissionsPaged']['rows'][number];

export type SubmissionsGridContext = DatedCrudGridContext<PagedSubmissionRow>;

export const CONVERT_ACTION: RowActionSpec = {
  key: 'convert',
  label: 'convert to lead',
  icon: PersonAddIcon,
  color: 'primary',
};

/** Where the enquiry went: to sales as a lead, to HR as an applicant, or nowhere yet. */
function filedAs(row: PagedSubmissionRow): string {
  if (row.leadId) {
    return 'Lead';
  }
  return row.applicantId ? 'Applicant' : '—';
}

/**
 * Column model for the server-paged submissions inbox. Form, source and status are what the
 * inbox is searched by, so those are the server-filtered ones; the payload is deliberately
 * absent — it is a different shape per form type and belongs in the triage drawer.
 */
export const SUBMISSION_COLUMNS: ColDef<PagedSubmissionRow>[] = [
  textColumn('formType', 'Form'),
  textColumn('source', 'Source'),
  statusColumn('status', 'Status'),
  derivedColumn('filedAs', 'Filed as', filedAs),
  dateColumn('createdAt', 'Received'),
  actionsColumn([CONVERT_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
