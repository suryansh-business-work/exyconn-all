import type { ColDef } from 'ag-grid-community';
import { actionsColumn, dateColumn, statusColumn, textColumn } from '@exyconn/crud';
import { employeeNameColumn, type NamedGridContext } from '../../grid/employee-name-column';
import type { ListEmployeeDocumentsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedEmployeeDocumentRow =
  ListEmployeeDocumentsPagedQuery['listEmployeeDocumentsPaged']['rows'][number];

/** Row handlers, the date formatter and the employee-name lookup ag-grid hands to shared cells. */
export type EmployeeDocumentGridContext = NamedGridContext<PagedEmployeeDocumentRow>;

/** Column model for the server-side Employee Documents grid. */
export const EMPLOYEE_DOCUMENT_COLUMNS: ColDef<PagedEmployeeDocumentRow>[] = [
  employeeNameColumn(),
  textColumn('title', 'Document'),
  statusColumn('kind', 'Type'),
  dateColumn('issuedOn', 'Issued'),
  actionsColumn(),
];
