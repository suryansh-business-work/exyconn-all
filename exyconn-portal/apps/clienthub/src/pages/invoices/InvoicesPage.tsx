import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ClientHubInvoicesDocument,
  useClientHubRemindersQuery,
  type ClientHubInvoicesQuery,
} from '@exyconn/shell/graphql/generated';
import { INVOICE_COLUMNS, type ClientInvoiceRow, type InvoicesGridContext } from './invoices-grid';
import { PayDialog, type PayableInvoice } from './PayDialog';
import { useInvoiceActions } from './useInvoiceActions';
import { balanceOf } from '../money';

const DUE_SOON_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Every invoice the client has been sent: pay online, download the PDF or have it emailed, and
 * export the list as CSV. A "Pay now" link from an email lands here as `?pay=<invoice id>`.
 */
export function InvoicesPage() {
  const { formatDate } = useSettings();
  const [params, setParams] = useSearchParams();
  const { data: remindersData, loading } = useClientHubRemindersQuery();
  const { download, email } = useInvoiceActions();
  const [paying, setPaying] = useState<PayableInvoice | null>(null);
  const fetchRows = usePagedFetcher(
    ClientHubInvoicesDocument,
    (data: ClientHubInvoicesQuery) => data.clientHubInvoices,
  );

  const owed = useMemo(() => remindersData?.clientHubReminders ?? [], [remindersData]);
  const payId = params.get('pay');

  // An emailed "Pay now" link: open that invoice's payment as soon as it is known to be owed.
  useEffect(() => {
    const target = payId ? owed.find((row) => row.invoiceId === payId) : undefined;
    if (target) {
      setPaying({
        id: target.invoiceId,
        number: target.number,
        balance: target.balance,
        currency: target.currency,
      });
      setParams({}, { replace: true });
    }
  }, [payId, owed, setParams]);

  const soon = Date.now() + DUE_SOON_DAYS * MS_PER_DAY;
  const stats: StatItem[] = [
    { label: 'Unpaid', value: String(owed.length), accent: color.blue[400] },
    {
      label: 'Overdue',
      value: String(owed.filter((row) => row.daysLate > 0).length),
      accent: color.red[200],
    },
    {
      label: 'Due this week',
      value: String(
        owed.filter((row) => row.daysLate === 0 && new Date(row.dueDate).getTime() <= soon).length,
      ),
      accent: color.orange[500],
    },
  ];

  const gridContext: InvoicesGridContext = {
    actions: {
      pay: (row: ClientInvoiceRow) =>
        setPaying({
          id: row.id,
          number: row.number,
          balance: balanceOf(row),
          currency: row.currency,
        }),
      download,
      email,
    },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Invoices"
      subtitle="Pay online, download or email any invoice, and export the list as CSV"
      entityLabel="invoice"
      exportFileName="invoices"
      stats={stats}
      statsLoading={!remindersData && loading}
      columnDefs={INVOICE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by invoice number or status…"
      extraDialogs={<PayDialog invoice={paying} onClose={() => setPaying(null)} />}
    />
  );
}
