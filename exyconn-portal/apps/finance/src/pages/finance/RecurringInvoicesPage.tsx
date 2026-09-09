import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListRecurringInvoicesPagedDocument,
  useDeleteRecurringInvoiceMutation,
  useRunRecurringInvoiceNowMutation,
  type ListRecurringInvoicesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { RecurringInvoiceForm } from './forms/recurring-invoice';
import {
  RECURRING_INVOICE_COLUMNS,
  type RecurringInvoiceRow,
  type RecurringInvoicesGridContext,
} from './recurring-invoices-grid';

/**
 * Retainers — the standing instructions that raise an invoice every period.
 *
 * Everything they produce is a DRAFT on the Invoices screen: the schedule prepares the
 * paperwork, a person still decides to send it. "Raise now" exists for the period somebody
 * needs early, and it advances the schedule exactly as the unattended run does, so reaching
 * for it cannot bill a client twice.
 */
export function RecurringInvoicesPage() {
  const notify = useNotify();
  const { formatDate } = useSettings();
  const [deleteRecurring] = useDeleteRecurringInvoiceMutation();
  const [runNow] = useRunRecurringInvoiceNowMutation();

  const crud = useCrudResource<RecurringInvoiceRow, RecurringInvoiceRow>({
    label: 'Recurring invoice',
    onDelete: (row) => deleteRecurring({ variables: { id: row.id } }),
    confirmMessage: (row) =>
      `Delete "${row.name}"? Invoices it has already raised are not affected.`,
  });

  const fetchRows = usePagedFetcher(
    ListRecurringInvoicesPagedDocument,
    (data: ListRecurringInvoicesPagedQuery) => data.listRecurringInvoicesPaged,
  );

  const raiseNow = async (row: RecurringInvoiceRow): Promise<void> => {
    try {
      await runNow({ variables: { id: row.id } });
      notify(`A draft invoice was raised for "${row.name}".`);
      crud.reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not raise the invoice', 'error');
    }
  };

  const gridContext: RecurringInvoicesGridContext = {
    actions: {
      runNow: (row: RecurringInvoiceRow) => {
        raiseNow(row).catch((error: unknown) => console.error('Raise now failed', error));
      },
      edit: crud.openEdit,
      delete: crud.remove,
    },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Recurring invoices"
      subtitle="Retainers that raise a draft invoice every period"
      entityLabel="retainer"
      exportFileName="recurring-invoices"
      stats={[]}
      crud={crud}
      renderForm={(initial) => (
        <RecurringInvoiceForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      permissionModule="RecurringInvoice"
      columnDefs={RECURRING_INVOICE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search retainers…"
    />
  );
}
