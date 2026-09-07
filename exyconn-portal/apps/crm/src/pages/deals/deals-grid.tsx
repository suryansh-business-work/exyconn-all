import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListDealsPagedQuery } from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';

export type PagedDealRow = ListDealsPagedQuery['listDealsPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type DealsGridContext = DatedCrudGridContext<PagedDealRow>;

/** Column model for the server-side Deals register. Title/Company/Contact hit the server filter. */
export const DEAL_COLUMNS: ColDef<PagedDealRow>[] = [
  textColumn('title', 'Deal'),
  textColumn('companyName', 'Company', (row) => row.companyName || '—'),
  textColumn('contactName', 'Contact', (row) => row.contactName || '—'),
  statusColumn('stage', 'Stage'),
  valueColumn('value', 'Value', (row) => formatMoney(row.value)),
  valueColumn('probability', 'Probability', (row) => `${row.probability}%`),
  dateColumn('expectedCloseDate', 'Expected close', '—'),
  textColumn('owner', 'Owner'),
  actionsColumn(),
];
