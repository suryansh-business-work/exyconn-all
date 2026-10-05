import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ClientHubPaymentsDocument,
  type ClientHubPaymentsQuery,
} from '@exyconn/shell/graphql/generated';
import { PAYMENT_COLUMNS, type PaymentsGridContext } from './payments-grid';

/** Every payment Exyconn has received from the client, exportable as CSV. */
export function TransactionsPage() {
  const { formatDate } = useSettings();
  const fetchRows = usePagedFetcher(
    ClientHubPaymentsDocument,
    (data: ClientHubPaymentsQuery) => data.clientHubPayments,
  );
  const gridContext: PaymentsGridContext = { actions: {}, formatDate };

  return (
    <CrudDashboard
      title="Transactions"
      subtitle="Every payment received against your invoices — export it as CSV for your books"
      entityLabel="transaction"
      exportFileName="transactions"
      stats={[]}
      columnDefs={PAYMENT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by invoice, reference or method…"
    />
  );
}
