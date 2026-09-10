import type { ColDef } from 'ag-grid-community';
import { actionsColumn, boolColumn, textColumn, type CrudGridContext } from '@exyconn/crud';
import type { ListCostCentersPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedCostCenterRow = ListCostCentersPagedQuery['listCostCentersPaged']['rows'][number];
export type CostCentersGridContext = CrudGridContext<PagedCostCenterRow>;

/** Column model for the cost centre register. */
export const COST_CENTER_COLUMNS: ColDef<PagedCostCenterRow>[] = [
  textColumn('code', 'Code'),
  textColumn('name', 'Name'),
  textColumn('description', 'Description'),
  boolColumn('isActive', 'Active'),
  actionsColumn(),
];
