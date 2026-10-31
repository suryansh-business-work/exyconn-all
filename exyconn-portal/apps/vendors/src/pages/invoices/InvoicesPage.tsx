import type { ColDef } from 'ag-grid-community';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  CrudDashboard,
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  usePagedFetcher,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { VendorInvoicesDocument, type VendorInvoicesQuery } from '@exyconn/shell/graphql/generated';
import { money } from '../../money';

type InvoiceRow = VendorInvoicesQuery['vendorInvoices']['rows'][number];

const OPEN_ACTION: RowActionSpec = {
  key: 'open',
  label: 'open the invoice document',
  icon: OpenInNewIcon,
  color: 'primary',
};

/** What was sent, where it stands with the buyer, and whether it has been paid. */
const COLUMNS: ColDef<InvoiceRow>[] = [
  textColumn('invoiceNumber', 'Invoice'),
  textColumn('purchaseOrderNumber', 'Order'),
  dateColumn('invoiceDate', 'Dated'),
  dateColumn('dueDate', 'Due'),
  valueColumn('amount', 'Amount', (row) => money(row.amount, row.currency)),
  statusColumn('status', 'Review'),
  statusColumn('paymentStatus', 'Payment'),
  dateColumn('paidOn', 'Paid on', '—'),
  textColumn('reviewNote', 'Buyer note'),
  actionsColumn([OPEN_ACTION]),
];

/** Every invoice the supplier sent, with the buyer's review and the payment status. */
export function InvoicesPage() {
  const { formatDate } = useSettings();
  const fetchRows = usePagedFetcher(
    VendorInvoicesDocument,
    (data: VendorInvoicesQuery) => data.vendorInvoices,
  );
  const context: DatedCrudGridContext<InvoiceRow> = {
    actions: {
      open: (row: InvoiceRow) => globalThis.open(row.fileUrl, '_blank', 'noopener'),
    },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Invoices"
      subtitle="What you sent, the buyer's review, and when it was paid"
      entityLabel="invoice"
      exportFileName="invoices"
      stats={[]}
      columnDefs={COLUMNS}
      fetchRows={fetchRows}
      context={context}
      searchPlaceholder="Search by invoice or order number…"
    />
  );
}
