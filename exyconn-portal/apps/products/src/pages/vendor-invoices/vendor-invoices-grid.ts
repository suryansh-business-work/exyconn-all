import type { ColDef } from 'ag-grid-community';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { VendorInvoiceRow } from './forms/reject-vendor-invoice';

export type VendorInvoicesGridContext = DatedCrudGridContext<VendorInvoiceRow>;

const awaitingReview = (row: VendorInvoiceRow) => row.status === 'SUBMITTED';

const OPEN_ACTION: RowActionSpec = {
  key: 'open',
  label: 'open the invoice document',
  icon: OpenInNewIcon,
  color: 'primary',
};
const APPROVE_ACTION: RowActionSpec = {
  key: 'approve',
  label: 'approve and file as a bill',
  icon: CheckCircleIcon,
  color: 'success',
  hidden: (row: VendorInvoiceRow) => !awaitingReview(row),
};
const REJECT_ACTION: RowActionSpec = {
  key: 'reject',
  label: 'send back to the supplier',
  icon: CancelIcon,
  color: 'error',
  hidden: (row: VendorInvoiceRow) => !awaitingReview(row),
};

/** Invoices suppliers sent through the vendor portal, their review and their payment. */
export const VENDOR_INVOICE_COLUMNS: ColDef<VendorInvoiceRow>[] = [
  textColumn('supplierName', 'Supplier'),
  textColumn('invoiceNumber', 'Invoice'),
  textColumn('purchaseOrderNumber', 'Order'),
  dateColumn('invoiceDate', 'Dated'),
  dateColumn('dueDate', 'Due'),
  valueColumn('amount', 'Amount', (row) => `${row.currency} ${row.amount.toLocaleString()}`),
  statusColumn('status', 'Review'),
  statusColumn('paymentStatus', 'Payment'),
  actionsColumn([OPEN_ACTION, APPROVE_ACTION, REJECT_ACTION]),
];
