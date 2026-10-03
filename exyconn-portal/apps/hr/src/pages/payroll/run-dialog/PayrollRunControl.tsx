import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Button, Flex, Text } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { usePayrollRunPlanQuery } from '@exyconn/shell/graphql/generated';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { RunPayrollDialog } from './RunPayrollDialog';
import { runBlocker } from './runPlan';

interface PayrollRunControlProps {
  month: number;
  year: number;
  /** The month being run, already written out ("October 2026"). */
  period: string;
  /** Reloads the page's summary once a run has issued slips. */
  onRan: () => Promise<unknown>;
}

/**
 * The "Run payroll" button, with the reason underneath whenever it cannot be pressed: the
 * month has not opened yet (Payroll Settings › run day), or nobody is left to run it for.
 */
export function PayrollRunControl({
  month,
  year,
  period,
  onRan,
}: Readonly<PayrollRunControlProps>) {
  const t = useT();
  const { formatDate } = useSettings();
  const [open, setOpen] = useState(false);
  const { data, loading, error, refetch } = usePayrollRunPlanQuery({
    variables: { month, year },
    fetchPolicy: 'cache-and-network',
  });
  const plan = data?.payrollRunPlan;
  const blocker = plan ? runBlocker(plan, period, formatDate(plan.opensOn)) : null;

  const ran = () => Promise.all([refetch(), onRan()]);

  return (
    <Flex direction="column" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
      <Button
        startIcon={<PlayArrowIcon />}
        onClick={() => setOpen(true)}
        loading={!data && loading}
        loadingPosition="start"
        disabled={!plan || Boolean(blocker)}
      >
        {t('Run payroll')}
      </Button>
      {blocker && (
        <Text size="caption" color="text.secondary">
          {t(blocker.message, blocker.values)}
        </Text>
      )}
      {error && (
        <Text size="caption" color="error">
          {error.message}
        </Text>
      )}
      {open && plan && (
        <RunPayrollDialog plan={plan} period={period} onClose={() => setOpen(false)} onRan={ran} />
      )}
    </Flex>
  );
}
