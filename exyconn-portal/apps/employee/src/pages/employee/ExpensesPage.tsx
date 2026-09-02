import { useState } from 'react';
import { Box, Button, Flex, Link, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useMyExpenseClaimsQuery } from '@exyconn/shell/graphql/generated';
import { ExpenseClaimForm, type MyExpenseClaimRow } from './forms/expense-claim';

/** Employee self-service: expense claims and where each one stands. */
export function ExpensesPage() {
  const { data, loading, refetch } = useMyExpenseClaimsQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const [open, setOpen] = useState(false);
  const rows = (data?.myExpenseClaims ?? []) as MyExpenseClaimRow[];

  const columns: Column<MyExpenseClaimRow>[] = [
    {
      key: 'category',
      label: 'Category',
      render: (c) => <Text weight="medium">{c.category}</Text>,
    },
    { key: 'description', label: 'Description', render: (c) => c.description },
    { key: 'amount', label: 'Claimed', render: (c) => formatMoney(c.amount, c.currency) },
    {
      key: 'approvedAmount',
      label: 'Approved',
      render: (c) =>
        c.approvedAmount === null || c.approvedAmount === undefined
          ? '—'
          : formatMoney(c.approvedAmount, c.currency),
    },
    { key: 'incurredOn', label: 'Incurred', render: (c) => formatDate(c.incurredOn) },
    { key: 'status', label: 'Status', render: (c) => <StatusChip value={c.status} /> },
    {
      key: 'receiptUrl',
      label: 'Receipt',
      render: (c) =>
        c.receiptUrl ? (
          <Link href={c.receiptUrl} target="_blank" rel="noopener noreferrer">
            Open
          </Link>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <Box>
      <Flex direction="row" justifyContent="space-between" alignItems="center">
        <PageHeader title="Expenses" subtitle="Claims and reimbursements" />
        <Button onClick={() => setOpen(true)}>New claim</Button>
      </Flex>

      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'You have not filed any claims yet.'}
        />
      </Box>

      <CrudDialog open={open} title="New expense claim" onClose={() => setOpen(false)}>
        <ExpenseClaimForm
          onCancel={() => setOpen(false)}
          onDone={async () => {
            setOpen(false);
            await refetch();
          }}
        />
      </CrudDialog>
    </Box>
  );
}
