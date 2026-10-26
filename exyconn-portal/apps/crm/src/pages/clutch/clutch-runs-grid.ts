import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  actionsColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ClutchRunsPagedQuery } from '@exyconn/shell/graphql/generated';

export type ClutchRunRow = ClutchRunsPagedQuery['clutchRunsPaged']['rows'][number];

export interface ClutchRunsContext extends CrudGridContext<ClutchRunRow> {
  formatDateTime: (value: string) => string;
}

const whenColumn: ColDef<ClutchRunRow> = {
  field: 'createdAt',
  headerName: 'When',
  width: 180,
  valueFormatter: (params: ValueFormatterParams<ClutchRunRow>) =>
    params.data ? (params.context as ClutchRunsContext).formatDateTime(params.data.createdAt) : '',
  filter: false,
  floatingFilter: false,
};

/** Every Clutch search, newest first; a row opens its results. */
export const CLUTCH_RUN_COLUMNS: ColDef<ClutchRunRow>[] = [
  whenColumn,
  {
    ...textColumn('keyword', 'Search', (row) => row.keyword || row.profileUrls.join(', ')),
    flex: 1,
    minWidth: 200,
  },
  textColumn('location', 'Location'),
  statusColumn('engine', 'Engine'),
  statusColumn('status', 'Status'),
  valueColumn('companyCount', 'Companies', (row) => String(row.companyCount)),
  textColumn('startedByName', 'By'),
  actionsColumn([{ key: 'delete', label: 'delete', icon: DeleteIcon }]),
];
