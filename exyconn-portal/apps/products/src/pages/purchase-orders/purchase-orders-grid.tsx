import type { ColDef } from 'ag-grid-community';
import InventoryIcon from '@mui/icons-material/Inventory';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { PurchaseOrderRow } from './forms/purchase-order';

export type { PurchaseOrderRow };

export type PurchaseOrdersGridContext = DatedCrudGridContext<PurchaseOrderRow>;

const RECEIVE_ACTION: RowActionSpec = {
  key: 'receive',
  label: 'book stock in',
  icon: InventoryIcon,
  color: 'primary',
};

/** How much of an order has turned up, as the reader would say it. */
function receivedOf(row: PurchaseOrderRow): string {
  const received = row.lines.reduce((total, line) => total + line.receivedQuantity, 0);
  const ordered = row.lines.reduce((total, line) => total + line.quantity, 0);
  return `${received} / ${ordered}`;
}

export const PURCHASE_ORDER_COLUMNS: ColDef<PurchaseOrderRow>[] = [
  textColumn('number', 'Number'),
  textColumn('supplierName', 'Supplier', (row) => row.supplierName || row.supplierId),
  valueColumn('total', 'Total', (row) => `${row.currency} ${row.total.toLocaleString()}`),
  // Keyed on `lines` because that is the field it is derived from; the header says what it means.
  valueColumn('lines', 'Received', receivedOf),
  statusColumn('status', 'Status'),
  dateColumn('orderDate', 'Ordered'),
  dateColumn('expectedDate', 'Expected', '—'),
  actionsColumn([RECEIVE_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
