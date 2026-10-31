import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { color } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  ListVendorInvoicesPagedDocument,
  useApproveVendorInvoiceMutation,
  useListVendorInvoicesStatsQuery,
  type ListVendorInvoicesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { RejectVendorInvoiceForm, type VendorInvoiceRow } from './forms/reject-vendor-invoice';
import { VENDOR_INVOICE_COLUMNS, type VendorInvoicesGridContext } from './vendor-invoices-grid';

/**
 * Products › Vendor invoices: what suppliers sent through the vendor portal. Approving one files
 * it as an unpaid Finance bill; marking that bill paid in Finance shows the supplier it is paid.
 */
export function VendorInvoicesPage() {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDate } = useSettings();
  const [rejecting, setRejecting] = useState<VendorInvoiceRow | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const { data, loading, refetch } = useListVendorInvoicesStatsQuery();
  const [approve] = useApproveVendorInvoiceMutation();
  const fetchRows = usePagedFetcher(
    ListVendorInvoicesPagedDocument,
    (result: ListVendorInvoicesPagedQuery) => result.listVendorInvoicesPaged,
  );

  const changed = () => {
    setRefreshSignal((value) => value + 1);
    refetch().catch((error: unknown) => console.error('Vendor invoice stats', error));
  };

  const approveInvoice = async (row: VendorInvoiceRow) => {
    const ok = await confirm({
      title: 'Approve invoice',
      message: 'Approve {number} from {supplier} and file it as a bill in Finance?',
      messageValues: { number: row.invoiceNumber, supplier: row.supplierName },
      confirmText: 'Approve',
    });
    if (!ok) return;
    try {
      await approve({ variables: { id: row.id } });
      notify('Invoice {number} approved and filed as a bill', 'success', {
        number: row.invoiceNumber,
      });
      changed();
    } catch (error) {
      notify(errorMessage(error, t('The invoice could not be approved')), 'error');
    }
  };

  const stats = data?.listVendorInvoicesStats;
  const statItems: StatItem[] = [
    { label: 'Invoices', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'To review',
      value: String(statCount(stats, 'status', 'SUBMITTED')),
      accent: color.amber[500],
    },
    {
      label: 'Approved',
      value: String(statCount(stats, 'status', 'APPROVED')),
      accent: color.green[500],
    },
    {
      label: 'Rejected',
      value: String(statCount(stats, 'status', 'REJECTED')),
      accent: color.red[200],
    },
  ];

  const context: VendorInvoicesGridContext = {
    actions: {
      open: (row: VendorInvoiceRow) => globalThis.open(row.fileUrl, '_blank', 'noopener'),
      approve: (row: VendorInvoiceRow) => {
        approveInvoice(row).catch((error: unknown) => console.error('Approve failed', error));
      },
      reject: setRejecting,
    },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Vendor invoices"
      subtitle="Invoices suppliers sent through the vendor portal — approve to file a bill in Finance"
      entityLabel="vendor invoice"
      exportFileName="vendor-invoices"
      stats={statItems}
      statsLoading={!data && loading}
      columnDefs={VENDOR_INVOICE_COLUMNS}
      fetchRows={fetchRows}
      context={context}
      refreshSignal={refreshSignal}
      searchPlaceholder="Search by supplier, invoice or order number…"
      extraDialogs={
        <CrudDialog
          open={rejecting !== null}
          title={rejecting ? t('Reject {number}', { number: rejecting.invoiceNumber }) : ''}
          onClose={() => setRejecting(null)}
        >
          {rejecting && (
            <RejectVendorInvoiceForm
              invoice={rejecting}
              onCancel={() => setRejecting(null)}
              onDone={() => {
                setRejecting(null);
                changed();
              }}
            />
          )}
        </CrudDialog>
      }
    />
  );
}
