import type { ColDef } from 'ag-grid-community';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type CrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListLeadsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedLeadRow = ListLeadsPagedQuery['listLeadsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type LeadsGridContext = CrudGridContext<PagedLeadRow>;

/** Hand-off to the pipeline. Gone once the lead has become a deal — it happens once. */
const CONVERT_ACTION: RowActionSpec = {
  key: 'convert',
  label: 'convert to deal',
  icon: SwapHorizIcon,
  color: 'primary',
  hidden: (row: PagedLeadRow) => Boolean(row.convertedDealId),
};

/** Column model for the server-side Leads grid. Name/Email hit the server filter. */
export const LEAD_COLUMNS: ColDef<PagedLeadRow>[] = [
  textColumn('name', 'Name'),
  textColumn('email', 'Email'),
  statusColumn('source', 'Source'),
  valueColumn('value', 'Value', (row) => row.value.toLocaleString()),
  statusColumn('stage', 'Stage'),
  actionsColumn([CONVERT_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
