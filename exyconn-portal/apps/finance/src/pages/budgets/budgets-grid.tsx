import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  derivedColumn,
  textColumn,
  valueColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ListBudgetsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedBudgetRow = ListBudgetsPagedQuery['listBudgetsPaged']['rows'][number];
export type BudgetsGridContext = CrudGridContext<PagedBudgetRow>;

/**
 * Column model for the budget register.
 *
 * The centre is shown by name, resolved from the list the page already loads for the form's
 * picker — a budget row carries only the id, and an id is not a thing anybody can read.
 */
export function budgetColumns(nameOf: (id: string) => string): ColDef<PagedBudgetRow>[] {
  return [
    derivedColumn('costCentre', 'Cost centre', (row) => nameOf(row.costCenterId)),
    textColumn('month', 'Month'),
    valueColumn('amount', 'Budget', (row) => `${row.currency} ${row.amount.toLocaleString()}`),
    textColumn('note', 'Note'),
    actionsColumn(),
  ];
}
