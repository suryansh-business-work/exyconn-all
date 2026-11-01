import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  VendorPurchaseOrdersDocument,
  useVendorAcknowledgePurchaseOrderMutation,
  type VendorPurchaseOrdersQuery,
} from '@exyconn/shell/graphql/generated';
import { ORDER_COLUMNS, type OrdersGridContext, type VendorOrderRow } from './orders-grid';
import { VendorInvoiceForm } from './forms/vendor-invoice';

/**
 * The supplier's purchase orders: acknowledge a new one so the buyer knows it arrived, and send
 * an invoice against any open one.
 */
export function OrdersPage() {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDate } = useSettings();
  const [acknowledge] = useVendorAcknowledgePurchaseOrderMutation();
  const [invoicing, setInvoicing] = useState<VendorOrderRow | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const fetchRows = usePagedFetcher(
    VendorPurchaseOrdersDocument,
    (data: VendorPurchaseOrdersQuery) => data.vendorPurchaseOrders,
  );

  const confirmOrder = async (row: VendorOrderRow) => {
    const ok = await confirm({
      title: 'Acknowledge order',
      message: 'Confirm that you have received order {number}?',
      messageValues: { number: row.number },
      confirmText: 'Acknowledge',
    });
    if (!ok) return;
    try {
      await acknowledge({ variables: { id: row.id } });
      notify('Order {number} acknowledged', 'success', { number: row.number });
      setRefreshSignal((value) => value + 1);
    } catch (error) {
      notify(errorMessage(error, t('The order could not be acknowledged')), 'error');
    }
  };

  const context: OrdersGridContext = {
    actions: {
      acknowledge: (row: VendorOrderRow) => {
        confirmOrder(row).catch((error: unknown) => console.error('Acknowledge failed', error));
      },
      invoice: setInvoicing,
    },
    formatDate,
  };

  const invoiced = () => {
    setInvoicing(null);
    setRefreshSignal((value) => value + 1);
  };

  return (
    <CrudDashboard
      title="Purchase orders"
      subtitle="Acknowledge new orders and send an invoice against any open one"
      entityLabel="purchase order"
      exportFileName="purchase-orders"
      stats={[]}
      columnDefs={ORDER_COLUMNS}
      fetchRows={fetchRows}
      context={context}
      refreshSignal={refreshSignal}
      searchPlaceholder="Search by order number or status…"
      extraDialogs={
        <CrudDialog
          open={invoicing !== null}
          title={invoicing ? t('Invoice for {number}', { number: invoicing.number }) : ''}
          onClose={() => setInvoicing(null)}
        >
          {invoicing && (
            <VendorInvoiceForm
              order={invoicing}
              onDone={invoiced}
              onCancel={() => setInvoicing(null)}
            />
          )}
        </CrudDialog>
      }
    />
  );
}
