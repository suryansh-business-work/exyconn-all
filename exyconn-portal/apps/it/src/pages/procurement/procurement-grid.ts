import type { ColDef } from 'ag-grid-community';
import GavelIcon from '@mui/icons-material/Gavel';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import {
  ItPurchaseStatus,
  type ListItPurchaseRequestsPagedQuery,
} from '@exyconn/shell/graphql/generated';

export type PagedPurchaseRow =
  ListItPurchaseRequestsPagedQuery['listItPurchaseRequestsPaged']['rows'][number];

export type ProcurementGridContext = DatedCrudGridContext<PagedPurchaseRow>;

/** A request can be decided while it is being asked for or quoted — not after. */
const AWAITING = new Set<ItPurchaseStatus>([ItPurchaseStatus.Requested, ItPurchaseStatus.Quoted]);

const DECIDE_ACTION: RowActionSpec = {
  key: 'decide',
  label: 'approve or reject',
  icon: GavelIcon,
  color: 'primary',
  hidden: (row: PagedPurchaseRow) => !AWAITING.has(row.status),
};

/** The cheapest quote, or the estimate when nobody has quoted yet. */
export const bestPrice = (row: PagedPurchaseRow): number =>
  row.quotes.length > 0 ? Math.min(...row.quotes.map((quote) => quote.amount)) : row.estimatedCost;

/** Column model for IT procurement. */
export const PROCUREMENT_COLUMNS: ColDef<PagedPurchaseRow>[] = [
  textColumn('title', 'Item'),
  statusColumn('kind', 'Kind'),
  valueColumn('quantity', 'Qty', (row) => String(row.quantity)),
  derivedColumn('bestPrice', 'Best price', (row) => bestPrice(row).toLocaleString()),
  derivedColumn('quotes', 'Quotes', (row) => String(row.quotes.length)),
  statusColumn('status', 'Status'),
  dateColumn('createdAt', 'Requested'),
  actionsColumn([DECIDE_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
