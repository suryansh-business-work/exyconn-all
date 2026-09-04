import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { Text } from '@exyconn/shell/components/ui';
import type { TrackerBillingQuery } from '@exyconn/shell/graphql/generated';

type BillingRow = TrackerBillingQuery['trackerBilling']['rows'][number];

interface Props {
  rows: BillingRow[];
  money: Intl.NumberFormat;
}

/** Per-employee hours and amount. Says plainly when a row has no rate behind it. */
export function TrackerBillingTable({ rows, money }: Readonly<Props>) {
  const columns: Column<BillingRow>[] = [
    { key: 'name', label: 'Employee' },
    { key: 'email', label: 'Email' },
    { key: 'payType', label: 'Pay type', render: (r) => <StatusChip value={r.payType} /> },
    { key: 'hours', label: 'Hours', render: (r) => `${r.hours} h` },
    {
      key: 'billingRate',
      label: 'Rate / hour',
      render: (r) =>
        r.rated ? (
          money.format(r.billingRate)
        ) : (
          <Text size="sm" color="text.secondary">
            Not set
          </Text>
        ),
    },
    { key: 'amount', label: 'Amount', render: (r) => money.format(r.amount) },
  ];

  return <DataTable columns={columns} rows={rows} emptyMessage="No tracked time in this range." />;
}
