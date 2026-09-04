import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListLicencesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedLicenceRow = ListLicencesPagedQuery['listLicencesPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type LicencesGridContext = DatedCrudGridContext<PagedLicenceRow>;

/**
 * Column model for the server-side licence register. Seats are shown used-of-total
 * because either number alone answers nothing: 8 seats is fine until 8 are taken.
 */
export const LICENCE_COLUMNS: ColDef<PagedLicenceRow>[] = [
  textColumn('name', 'Licence'),
  textColumn('vendor', 'Vendor'),
  derivedColumn<PagedLicenceRow>(
    'seats',
    'Seats',
    (row) => `${row.assigneeIds.length} / ${row.seatsTotal}`,
  ),
  valueColumn('cost', 'Cost', (row) => row.cost.toLocaleString()),
  statusColumn('billingCycle', 'Billing'),
  dateColumn('renewalDate', 'Renews'),
  statusColumn('status', 'Status'),
  actionsColumn(),
];
