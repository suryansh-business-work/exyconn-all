import { useMemo } from 'react';
import { Chip, Stack, Typography } from '@exyconn/shell/components/ui';
import { useTrackerBillingByProjectQuery } from '@exyconn/shell/graphql/generated';

interface TimeLogBillingProps {
  projectId: string;
  from: string;
  to: string;
  /** The money agreed for the project, or null when no budget was set. */
  budgetAmount: number | null;
}

/**
 * What the month's time on this project is worth, priced at each person's HR billing rate,
 * beside the money the project agreed. One line: the detail lives in Tracker → Billing.
 */
export function TimeLogBilling({
  projectId,
  from,
  to,
  budgetAmount,
}: Readonly<TimeLogBillingProps>) {
  const { data } = useTrackerBillingByProjectQuery({
    variables: { projectId, from, to },
    fetchPolicy: 'cache-and-network',
  });
  const row = data?.trackerBillingByProject[0];
  const money = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: row?.currency || 'INR',
        maximumFractionDigits: 2,
      }),
    [row?.currency],
  );

  if (!row) {
    return null;
  }
  const unrated = row.employees.filter((employee) => employee.rate <= 0).length;
  const over = budgetAmount !== null && row.amount > budgetAmount;
  const budgetLabel = budgetAmount === null ? '' : ` of ${money.format(budgetAmount)} budget`;

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Typography variant="body2">
        Billing: {row.hours} h · {money.format(row.amount)}
        {budgetLabel}
      </Typography>
      {over ? <Chip size="small" color="error" label="Over budget" /> : null}
      {unrated > 0 ? (
        <Chip
          size="small"
          variant="outlined"
          color="warning"
          label={`${unrated} without a billing rate`}
        />
      ) : null}
    </Stack>
  );
}
