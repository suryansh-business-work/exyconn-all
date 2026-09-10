import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  textColumn,
  valueColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ListTaxSlabsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedTaxSlabRow = ListTaxSlabsPagedQuery['listTaxSlabsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via `context`. */
export type TaxSlabGridContext = CrudGridContext<PagedTaxSlabRow>;

/** The top band has no ceiling, which is a fact about the table rather than a missing value. */
const NO_UPPER_BOUND = 'and above';

const money = (amount: number) => amount.toLocaleString();

/** Column model for the server-side Tax Slabs grid, in the order the bands are walked. */
export const TAX_SLAB_COLUMNS: ColDef<PagedTaxSlabRow>[] = [
  textColumn('regimeKey', 'Regime'),
  textColumn('financialYear', 'Financial year'),
  valueColumn('order', 'Position', (row) => String(row.order)),
  valueColumn('fromAmount', 'From', (row) => money(row.fromAmount)),
  valueColumn('toAmount', 'To', (row) =>
    row.toAmount === null || row.toAmount === undefined ? NO_UPPER_BOUND : money(row.toAmount),
  ),
  valueColumn('ratePercent', 'Rate', (row) => `${row.ratePercent}%`),
  boolColumn('active', 'Active'),
  actionsColumn(),
];
