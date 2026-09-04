import { useMemo, useState } from 'react';
import { Box, CircularProgress, Flex, Grid, Text } from '@exyconn/shell/components/ui';
import { DatePicker } from '@exyconn/ui/pickers';
import { StatCard } from '@exyconn/shell/components/dashboard/StatCard';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useTrackerBillingQuery } from '@exyconn/shell/graphql/generated';
import { TrackerBillingTable } from './TrackerBillingTable';
import { monthRange, toDateOrNull } from './tracker.billing';

/**
 * What the workspace's tracked time is worth.
 *
 * The rates are not the tracker's: every one of them comes from the employee's salary
 * structure in HR, so this report and payroll can never disagree about what somebody costs.
 * Hours are ACTIVE time only, matching the desktop app's own progress bar — billing a
 * customer for idle minutes would be indefensible.
 */
export function TrackerBillingPage() {
  const [range, setRange] = useState(monthRange);
  const { data, loading } = useTrackerBillingQuery({
    variables: { from: range.from, to: range.to },
    fetchPolicy: 'cache-and-network',
  });

  const billing = data?.trackerBilling;
  const money = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: billing?.currency || 'INR',
        maximumFractionDigits: 2,
      }),
    [billing?.currency],
  );

  const unrated = billing?.rows.filter((row) => !row.rated).length ?? 0;

  return (
    <Box>
      <PageHeader
        title="Billing"
        subtitle="Tracked hours priced at each employee's billing rate from HR"
      />

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="From"
            value={new Date(range.from)}
            onChange={(value) => {
              const next = toDateOrNull(value);
              if (next) {
                setRange((current) => ({ ...current, from: next.toISOString() }));
              }
            }}
            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="To"
            value={new Date(range.to)}
            onChange={(value) => {
              const next = toDateOrNull(value);
              if (next) {
                setRange((current) => ({ ...current, to: next.toISOString() }));
              }
            }}
            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
          />
        </Grid>
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

      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        {loading && !billing ? (
          <Flex justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress size={22} aria-label="Loading billing" />
          </Flex>
        ) : (
          <TrackerBillingTable rows={billing?.rows ?? []} money={money} />
        )}
      </Box>
    </Box>
  );
}
