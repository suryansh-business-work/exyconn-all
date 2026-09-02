import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListEmployeeDocumentsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedEmployeeDocumentRow =
  ListEmployeeDocumentsPagedQuery['listEmployeeDocumentsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type EmployeeDocumentGridContext = DatedCrudGridContext<PagedEmployeeDocumentRow>;

/** Column model for the server-side Employee Documents grid. */
export const EMPLOYEE_DOCUMENT_COLUMNS: ColDef<PagedEmployeeDocumentRow>[] = [
  textColumn('title', 'Document'),
  statusColumn('kind', 'Type'),
  dateColumn('issuedOn', 'Issued'),
  actionsColumn(),
];
