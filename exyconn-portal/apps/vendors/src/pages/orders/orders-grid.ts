import type { ColDef } from 'ag-grid-community';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { VendorPurchaseOrdersQuery } from '@exyconn/shell/graphql/generated';
import { money } from '../../money';

export type VendorOrderRow = VendorPurchaseOrdersQuery['vendorPurchaseOrders']['rows'][number];
export type OrdersGridContext = DatedCrudGridContext<VendorOrderRow>;

/** An open order the supplier has not confirmed yet. */
export const canAcknowledge = (row: VendorOrderRow) =>
  row.status === 'ORDERED' && !row.acknowledgedAt;

const ACKNOWLEDGE_ACTION: RowActionSpec = {
  key: 'acknowledge',
  label: 'acknowledge this order',
  icon: TaskAltIcon,
  color: 'success',
  hidden: (row: VendorOrderRow) => !canAcknowledge(row),
};
const INVOICE_ACTION: RowActionSpec = {
  key: 'invoice',
  label: 'send an invoice for this order',
  icon: UploadFileIcon,
  color: 'primary',
  hidden: (row: VendorOrderRow) => row.status === 'CANCELLED',
};

/** What is on the order, in brief: "3 × Paper, 1 × Toner". */
const itemsOf = (row: VendorOrderRow) =>
  row.lines.map((line) => `${line.quantity} × ${line.productName}`).join(', ');

/** The supplier's purchase orders: what was ordered, by when, and whether it is confirmed. */
export const ORDER_COLUMNS: ColDef<VendorOrderRow>[] = [
  textColumn('number', 'Order'),
  dateColumn('orderDate', 'Ordered'),
  dateColumn('expectedDate', 'Expected', '—'),
  derivedColumn('items', 'Items', itemsOf),
  valueColumn('total', 'Total', (row) => money(row.total, row.currency)),
  statusColumn('status', 'Status'),
  dateColumn('acknowledgedAt', 'Acknowledged', '—'),
  actionsColumn([ACKNOWLEDGE_ACTION, INVOICE_ACTION]),
];
