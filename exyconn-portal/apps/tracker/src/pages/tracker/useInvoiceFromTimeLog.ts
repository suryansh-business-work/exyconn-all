import { useState } from 'react';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { appUrl } from '@exyconn/shell/config/apps';
import { useCreateInvoiceFromTimeLogMutation } from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import type { BillingRange } from './BillingRangePicker';
import type { ProjectBillingRow } from './tracker.billing';

/** The invoice just raised, for the link the toast cannot carry. */
export interface RaisedInvoice {
  number: string;
  /** Where to open it — the finance portal's invoice list, cross-app. */
  url: string;
}

/**
 * Raises a draft invoice for one project's billable time, after a confirmation that names
 * the amount. The server prices it again from the same data, so what is confirmed here is
 * what the invoice says.
 */
export function useInvoiceFromTimeLog(range: BillingRange, money: Intl.NumberFormat) {
  const confirm = useConfirm();
  const notify = useNotify();
  const [createInvoice, { loading }] = useCreateInvoiceFromTimeLogMutation();
  const [raised, setRaised] = useState<RaisedInvoice | null>(null);

  const raise = async (row: ProjectBillingRow) => {
    const ok = await confirm({
      title: 'Create invoice',
      message: `Raise a draft invoice to ${row.clientName || 'the client'} for ${money.format(row.amount)} — ${row.hours} h on ${row.projectName}?`,
      confirmText: 'Create invoice',
    });
    if (!ok) {
      return;
    }
    try {
      const { data } = await createInvoice({
        variables: { projectId: row.projectId, from: range.from, to: range.to },
      });
      const invoice = data?.createInvoiceFromTimeLog;
      if (invoice) {
        setRaised({ number: invoice.number, url: appUrl('finance', '/finance/invoices') });
        notify(`Invoice ${invoice.number} created as a draft.`, 'success');
      }
    } catch (error) {
      notify(errorMessage(error, 'The invoice could not be created.'), 'error');
    }
  };

  return { raise, raising: loading, raised, dismiss: () => setRaised(null) };
}
