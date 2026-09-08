import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  actionsColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListAuditLogsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedAuditRow = ListAuditLogsPagedQuery['listAuditLogsPaged']['rows'][number];

/** Row handlers plus the date-time formatter the "When" column reads off the context. */
export interface AuditGridContext extends CrudGridContext<PagedAuditRow> {
  formatDateTime: (value: string) => string;
}

const DETAILS_ACTION: RowActionSpec = {
  key: 'details',
  label: 'view details',
  icon: InfoOutlinedIcon,
};

/** Date and time, not just the date — two edits a minute apart must read in order. */
const whenColumn: ColDef<PagedAuditRow> = {
  field: 'createdAt',
  headerName: 'When',
  width: 190,
  valueFormatter: (params: ValueFormatterParams<PagedAuditRow>) =>
    params.data ? (params.context as AuditGridContext).formatDateTime(params.data.createdAt) : '',
  filter: false,
  floatingFilter: false,
};

/** Column model for the server-side Audit Log grid. Actor/module/entity/summary hit the server. */
export const AUDIT_COLUMNS: ColDef<PagedAuditRow>[] = [
  whenColumn,
  textColumn('actorName', 'Actor', (row) => row.actorName || row.actorEmail),
  statusColumn('action', 'Action'),
  textColumn('module', 'Module'),
  textColumn('entityLabel', 'Entity'),
  { ...textColumn('summary', 'Summary'), flex: 1, minWidth: 240 },
  actionsColumn([DETAILS_ACTION]),
];
