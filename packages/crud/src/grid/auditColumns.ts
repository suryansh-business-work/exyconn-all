import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { AuditLogRow } from '@exyconn/shell/components/audit';
import { actionsColumn, statusColumn, textColumn } from './columns';
import type { CrudGridContext, RowActionSpec } from './types';

/** Row handlers plus the date-time formatter the "When" column reads off the context. */
export interface AuditGridContext extends CrudGridContext<AuditLogRow> {
  formatDateTime: (value: string) => string;
}

const DETAILS_ACTION: RowActionSpec = {
  key: 'details',
  label: 'view details',
  icon: InfoOutlinedIcon,
};

/** Date and time, not just the date — two edits a minute apart must read in order. */
const whenColumn: ColDef<AuditLogRow> = {
  field: 'createdAt',
  headerName: 'When',
  width: 190,
  valueFormatter: (params: ValueFormatterParams<AuditLogRow>) =>
    params.data ? (params.context as AuditGridContext).formatDateTime(params.data.createdAt) : '',
  filter: false,
  floatingFilter: false,
};

/**
 * Column model for every server-side audit grid — Admin's whole log and a portal's own
 * change log. Actor/module/entity/summary hit the server.
 */
export const AUDIT_COLUMNS: ColDef<AuditLogRow>[] = [
  whenColumn,
  textColumn('actorName', 'Actor', (row) => row.actorName || row.actorEmail),
  statusColumn('action', 'Action'),
  textColumn('module', 'Module'),
  textColumn('entityLabel', 'Entity'),
  { ...textColumn('summary', 'Summary'), flex: 1, minWidth: 240 },
  actionsColumn([DETAILS_ACTION]),
];
