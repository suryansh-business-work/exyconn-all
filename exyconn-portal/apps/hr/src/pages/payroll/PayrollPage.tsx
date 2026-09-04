import { useMemo, useState } from 'react';
import { Box, Button, Flex, Grid, MenuItem, TextField } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { StatCard, type StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { formatMoney } from '@exyconn/shell/utils/money';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PaidIcon from '@mui/icons-material/Paid';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import {
  usePayrollSummaryQuery,
  useRunPayrollMutation,
  useMarkPayrollPaidMutation,
  useSendSalarySlipsMutation,
} from '@exyconn/shell/graphql/generated';
import { PayrollSlipsTable } from './PayrollSlipsTable';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Payroll run for one month: review the totals, generate or recompute every
 * active employee's slip, then mark the month paid. Paid slips are never touched.
 */
export function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const notify = useNotify();
  const confirm = useConfirm();

  const summary = usePayrollSummaryQuery({
    variables: { month, year },
    fetchPolicy: 'cache-and-network',
  });
  const [runPayroll, { loading: running }] = useRunPayrollMutation();
  const [markPaid, { loading: paying }] = useMarkPayrollPaidMutation();
  const [sendSlips, { loading: sending }] = useSendSalarySlipsMutation();
  const s = summary.data?.payrollSummary;

  const tiles = useMemo<StatItem[]>(
    () => [
      { label: 'Slips', value: String(s?.slips ?? 0), accent: '#155dfc' },
      { label: 'Paid', value: String(s?.paid ?? 0), accent: '#16a34a' },
      { label: 'Total gross', value: formatMoney(s?.totalGross ?? 0), accent: '#0ea5e9' },
      { label: 'Total deductions', value: formatMoney(s?.totalDeductions ?? 0), accent: '#f97316' },
      { label: 'Total net', value: formatMoney(s?.totalNet ?? 0), accent: '#a855f7' },
    ],
    [s],
  );

  const run = async () => {
    const ok = await confirm({
      title: `Run payroll for ${MONTHS[month - 1]} ${year}?`,
      message:
        'Every active employee with a salary structure gets a slip. Existing GENERATED slips are recomputed; PAID slips are left alone.',
    });
    if (!ok) return;
    try {
      const { data } = await runPayroll({ variables: { month, year } });
      const r = data?.runPayroll;
      notify(
        `Generated ${r?.generated ?? 0}, recomputed ${r?.updated ?? 0}, skipped ${r?.skipped ?? 0}.`,
        'success',
      );
      await summary.refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Payroll run failed', 'error');
    }
  };

  const pay = async () => {
    const ok = await confirm({
      title: `Mark ${MONTHS[month - 1]} ${year} as paid?`,
      message:
        'All GENERATED slips for the month become PAID. This cannot be recomputed afterwards.',
    });
    if (!ok) return;
    try {
      const { data } = await markPaid({ variables: { month, year } });
      notify(`Marked ${data?.markPayrollPaid ?? 0} slips paid.`, 'success');
      await summary.refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not mark paid', 'error');
    }
  };

  const email = async () => {
    const ok = await confirm({
      title: `Email payslips for ${MONTHS[month - 1]} ${year}?`,
      message:
        'Every employee with a slip for this month is emailed their own payslip as a PDF. This does not wait for the schedule.',
    });
    if (!ok) return;
    try {
      const { data } = await sendSlips({ variables: { month, year } });
      const r = data?.sendSalarySlips;
      notify(
        `Emailed ${r?.sent ?? 0} payslips — ${r?.failed ?? 0} failed, ${r?.skipped ?? 0} without an address.`,
        'success',
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not email the payslips', 'error');
    }
  };

  return (
    <Box>
      <PageHeader title="Payroll" subtitle="Generate, review and pay the month" />

      <Box sx={[glass, { p: 2, mb: 2 }]}>
        <Flex direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            sx={{ minWidth: 160 }}
          >
            {MONTHS.map((name, index) => (
              <MenuItem key={name} value={index + 1}>
                {name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ width: 120 }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Button startIcon={<PlayArrowIcon />} onClick={run} disabled={running}>
            {running ? 'Running…' : 'Run payroll'}
          </Button>
          <Button
            startIcon={<PaidIcon />}
            onClick={pay}
            disabled={paying || (s?.slips ?? 0) === 0 || (s?.paid ?? 0) === (s?.slips ?? 0)}
          >
            Mark paid
          </Button>
          <Button
            startIcon={<ForwardToInboxIcon />}
            onClick={email}
            disabled={sending || (s?.slips ?? 0) === 0}
          >
            {sending ? 'Emailing…' : 'Email payslips'}
          </Button>
        </Flex>
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {tiles.map((tile) => (
          <Grid key={tile.label} item xs={6} sm={4} md={2.4}>
            <StatCard {...tile} />
          </Grid>
        ))}
      </Grid>

      <PayrollSlipsTable month={month} year={year} refreshKey={`${s?.slips}-${s?.paid}`} />
    </Box>
  );
}
