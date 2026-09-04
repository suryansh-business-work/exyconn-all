import { useState } from 'react';
import { format } from 'date-fns';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import { Box, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useMySalarySlipsQuery } from '@exyconn/shell/graphql/generated';
import { usePayslipDownload } from '@exyconn/shell/hooks/usePayslipDownload';

type SalarySlipRow = {
  id: string;
  month: number;
  year: number;
  currency: string;
  gross: number;
  deductions: number;
  net: number;
  status: string;
  issuedDate: string;
};

const periodLabel = (r: SalarySlipRow) => format(new Date(r.year, r.month - 1, 1), 'MMMM yyyy');

/** A single label/value row inside the payslip breakdown drawer. */
function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Text size="sm" color="text.secondary">
        {label}
      </Text>
      <Text weight={strong ? 'medium' : 'regular'}>{value}</Text>
    </Flex>
  );
}

/** Employee self-service: browse and inspect your monthly salary slips. */
export function SalarySlipsPage() {
  const { data, loading } = useMySalarySlipsQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const { download, downloading } = usePayslipDownload();
  const [selected, setSelected] = useState<SalarySlipRow | null>(null);

  const rows = (data?.mySalarySlips ?? []) as SalarySlipRow[];

  const columns: Column<SalarySlipRow>[] = [
    {
      key: 'period',
      label: 'Period',
      render: (r) => <Text weight="medium">{periodLabel(r)}</Text>,
    },
    { key: 'gross', label: 'Gross', render: (r) => formatMoney(r.gross, r.currency) },
    {
      key: 'deductions',
      label: 'Deductions',
      render: (r) => formatMoney(r.deductions, r.currency),
    },
    {
      key: 'net',
      label: 'Net',
      render: (r) => <Text weight="medium">{formatMoney(r.net, r.currency)}</Text>,
    },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'issuedDate', label: 'Issued', render: (r) => formatDate(r.issuedDate) },
  ];

  const actions: RowAction<SalarySlipRow>[] = [
    {
      icon: <VisibilityIcon fontSize="small" />,
      tooltip: 'View payslip',
      ariaLabel: 'view',
      onClick: (r) => setSelected(r),
    },
    {
      icon: <DownloadIcon fontSize="small" />,
      tooltip: 'Download PDF',
      ariaLabel: 'download payslip',
      onClick: (r) => {
        download(r.id).catch(() => undefined);
      },
    },
  ];

  return (
    <Box>
      <PageHeader title="Salary Slips" subtitle="Your monthly payslips" />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          actions={actions}
          emptyMessage={loading ? 'Loading…' : 'No payslips yet.'}
        />
      </Box>
      <CrudDialog
        open={Boolean(selected)}
        title={selected ? periodLabel(selected) : ''}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <Flex direction="column" spacing={1.5}>
            <DetailRow label="Gross" value={formatMoney(selected.gross, selected.currency)} />
            <DetailRow
              label="Deductions"
              value={formatMoney(selected.deductions, selected.currency)}
            />
            <DetailRow label="Net" value={formatMoney(selected.net, selected.currency)} strong />
            <Button
              startIcon={<DownloadIcon />}
              disabled={downloading}
              onClick={() => {
                download(selected.id).catch(() => undefined);
              }}
            >
              {downloading ? 'Preparing…' : 'Download PDF'}
            </Button>
          </Flex>
        )}
      </CrudDialog>
    </Box>
  );
}
