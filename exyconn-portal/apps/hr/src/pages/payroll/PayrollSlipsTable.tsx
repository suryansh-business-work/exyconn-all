import { useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import DownloadIcon from '@mui/icons-material/Download';
import { Box, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { glass } from '@exyconn/shell/components/glass/glass';
import { formatMoney } from '@exyconn/shell/utils/money';
import { usePayslipDownload } from '@exyconn/shell/hooks/usePayslipDownload';
import {
  ListSalarySlipsPagedDocument,
  ListUsersDocument,
  FilterOp,
  type ListSalarySlipsPagedQuery,
  type ListUsersQuery,
} from '@exyconn/shell/graphql/generated';

type Slip = ListSalarySlipsPagedQuery['listSalarySlipsPaged']['rows'][number] & {
  employeeName: string;
};

interface PayrollSlipsTableProps {
  month: number;
  year: number;
  /** Changes whenever the summary changes, which is when the slips have changed too. */
  refreshKey: string;
}

/** Every slip of the selected month, with employee names, newest issue first. */
export function PayrollSlipsTable({ month, year, refreshKey }: Readonly<PayrollSlipsTableProps>) {
  const client = useApolloClient();
  const { download } = usePayslipDownload();
  const [rows, setRows] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [slips, users] = await Promise.all([
        client.query<ListSalarySlipsPagedQuery>({
          query: ListSalarySlipsPagedDocument,
          fetchPolicy: 'network-only',
          variables: {
            input: {
              page: 1,
              pageSize: 200,
              filters: [
                { field: 'month', op: FilterOp.Equals, value: String(month) },
                { field: 'year', op: FilterOp.Equals, value: String(year) },
              ],
            },
          },
        }),
        client.query<ListUsersQuery>({ query: ListUsersDocument }),
      ]);
      if (cancelled) return;
      const names = new Map(users.data.listUsers.map((u) => [u.id, u.name]));
      setRows(
        slips.data.listSalarySlipsPaged.rows.map((r) => ({
          ...r,
          employeeName: names.get(r.employeeId) ?? r.employeeId,
        })),
      );
      setLoading(false);
    })().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [client, month, year, refreshKey]);

  const columns: Column<Slip>[] = [
    {
      key: 'employeeName',
      label: 'Employee',
      render: (r) => <Text weight="medium">{r.employeeName}</Text>,
    },
    { key: 'gross', label: 'Gross', render: (r) => formatMoney(r.gross, r.currency) },
    {
      key: 'deductions',
      label: 'Deductions',
      render: (r) => formatMoney(r.deductions, r.currency),
    },
    { key: 'net', label: 'Net', render: (r) => formatMoney(r.net, r.currency) },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];

  const actions: RowAction<Slip>[] = [
    {
      icon: <DownloadIcon fontSize="small" />,
      tooltip: 'Download payslip PDF',
      ariaLabel: 'download payslip',
      onClick: (r) => {
        download(r.id).catch(() => undefined);
      },
    },
  ];

  return (
    <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        emptyMessage={loading ? 'Loading…' : 'No slips for this month yet — run payroll.'}
      />
    </Box>
  );
}
