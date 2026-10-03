import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Flex,
  Text,
  TextField,
} from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useRunPayrollMutation } from '@exyconn/shell/graphql/generated';
import { CandidateTable } from './CandidateTable';
import { RunConfirmation } from './RunConfirmation';
import { SelectionTotalsBar } from './SelectionTotalsBar';
import { useCandidateSelection } from './useCandidateSelection';
import type { RunPlan } from './runPlan';

interface RunPayrollDialogProps {
  plan: RunPlan;
  /** The month being run, already written out ("October 2026"). */
  period: string;
  onClose: () => void;
  /** Called once the run has issued its slips, so the page can reload what changed. */
  onRan: () => Promise<unknown>;
}

/**
 * Pick who the month is run for, then confirm. Rendered only while open, so every opening
 * starts from the plan as it stands: every READY employee picked, nobody else pickable.
 */
export function RunPayrollDialog({
  plan,
  period,
  onClose,
  onRan,
}: Readonly<RunPayrollDialogProps>) {
  const t = useT();
  const notify = useNotify();
  const [confirming, setConfirming] = useState(false);
  const [search, setSearch] = useState('');
  const selection = useCandidateSelection(plan.employees);
  const [runPayroll, { loading }] = useRunPayrollMutation();

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return plan.employees.filter((c) => c.name.toLowerCase().includes(needle));
  }, [plan.employees, search]);

  const run = async () => {
    try {
      const { data } = await runPayroll({
        variables: {
          month: plan.month,
          year: plan.year,
          employeeIds: selection.picked.map((c) => c.employeeId),
        },
      });
      notify('Generated {count} salary slips', 'success', {
        count: data?.runPayroll.generated ?? 0,
      });
      onClose();
      await onRan();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Payroll run failed', 'error');
    }
  };

  return (
    <Dialog open onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        {confirming
          ? t('Confirm the run for {period}', { period })
          : t('Run payroll for {period}', { period })}
      </DialogTitle>
      <DialogContent>
        {confirming ? (
          <RunConfirmation picked={selection.picked} period={period} />
        ) : (
          <Flex direction="column" spacing={1.5}>
            <Text size="sm" color="text.secondary">
              {t(
                '{ready} ready · {alreadyRun} already run · {noStructure} without a salary structure',
                {
                  ready: plan.readyCount,
                  alreadyRun: plan.alreadyRunCount,
                  noStructure: plan.noStructureCount,
                },
              )}
            </Text>
            <TextField
              size="small"
              label={t('Search by name')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ maxWidth: 320 }}
            />
            <CandidateTable
              rows={rows}
              isPicked={selection.isPicked}
              onToggle={selection.toggle}
              onToggleAll={selection.toggleAll}
              allPicked={selection.allPicked}
              somePicked={selection.somePicked}
              readyCount={selection.readyCount}
            />
            <SelectionTotalsBar totals={selection.totals} />
          </Flex>
        )}
      </DialogContent>
      <DialogActions>
        {confirming ? (
          <>
            <Button color="inherit" onClick={() => setConfirming(false)} disabled={loading}>
              {t('Back')}
            </Button>
            <Button variant="contained" onClick={run} loading={loading}>
              {t('Run payroll')}
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={() => setConfirming(true)}
              disabled={selection.totals.count === 0}
            >
              {t('Continue')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
