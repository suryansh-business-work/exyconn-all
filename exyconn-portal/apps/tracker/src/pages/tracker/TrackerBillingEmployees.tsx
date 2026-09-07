import { useMemo } from 'react';
import { ExportCsvButton } from '@exyconn/crud';
import { Box, CircularProgress, Flex, Grid, Text } from '@exyconn/shell/components/ui';
import { StatCard } from '@exyconn/shell/components/dashboard/StatCard';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useTrackerBillingQuery } from '@exyconn/shell/graphql/generated';
import { TrackerBillingTable } from './TrackerBillingTable';
import { EMPLOYEE_BILLING_CSV, moneyFormat } from './tracker.billing';
import type { BillingRange } from './BillingRangePicker';

/**
 * Tracked time priced per employee.
 *
 * The rates are not the tracker's: every one of them comes from the employee's salary
 * structure in HR, so this report and payroll can never disagree about what somebody costs.
 */
export function TrackerBillingEmployees({ range }: Readonly<{ range: BillingRange }>) {
  const { data, loading } = useTrackerBillingQuery({
    variables: { from: range.from, to: range.to },
    fetchPolicy: 'cache-and-network',
  });

  const billing = data?.trackerBilling;
  const rows = useMemo(() => billing?.rows ?? [], [billing]);
  const money = useMemo(() => moneyFormat(billing?.currency), [billing?.currency]);
  const unrated = rows.filter((row) => !row.rated).length;

  return (
    <Box sx={{ pt: 2 }}>
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="Hours" value={String(billing?.totalHours ?? 0)} accent="#0ea5e9" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Amount"
            value={money.format(billing?.totalAmount ?? 0)}
            accent="#7be37b"
          />
        </Grid>
      </Grid>

      {unrated > 0 && (
        <Text size="sm" color="warning.main" sx={{ display: 'block', mb: 1.5 }}>
          {unrated} {unrated === 1 ? 'employee has' : 'employees have'} tracked time but no billing
          rate. Set one on their employee record in HR — the amount below is zero because nobody
          priced the work, not because it was free.
        </Text>
      )}

      <Flex direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <ExportCsvButton
          fileName="billing-by-employee"
          columns={EMPLOYEE_BILLING_CSV}
          loadRows={() => Promise.resolve(rows)}
        />
      </Flex>

      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        {loading && !billing ? (
          <Flex justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress size={22} aria-label="Loading billing" />
          </Flex>
        ) : (
          <TrackerBillingTable rows={rows} money={money} />
        )}
      </Box>
    </Box>
  );
}
