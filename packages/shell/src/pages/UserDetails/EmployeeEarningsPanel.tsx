import { useState } from 'react';
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from 'date-fns';
import { useFormatters, useT } from '@exyconn/i18n';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { Alert, Box, DatePicker, Flex, Heading, Skeleton } from '@/components/ui';
import { DetailFact, DetailFactGrid } from '@/components/data/DetailFact';
import { EmptyState } from '@/components/feedback/EmptyState';
import { panel } from '@/components/glass/glass';
import { PayType, useEmployeeEarningsQuery, type EmployeeEarningsQuery } from '@/graphql/generated';
import { formatDuration } from '../tracker-view/tracker.format';

type Earnings = EmployeeEarningsQuery['employeeEarnings'];

/** Tracked time, the hourly rate, and what that time pays. */
function EarningsFacts({ earnings }: Readonly<{ earnings: Earnings }>) {
  const { formatCurrency } = useFormatters();
  const money = (value: number | null | undefined) =>
    formatCurrency(value, { currency: earnings.currency });
  return (
    <DetailFactGrid>
      <DetailFact label="Tracked hours">{formatDuration(earnings.trackedMs)}</DetailFact>
      <DetailFact label="Rate per hour">{money(earnings.rate)}</DetailFact>
      <DetailFact label="Amount">{money(earnings.amount)}</DetailFact>
    </DetailFactGrid>
  );
}

/** Keeps what a picker handed back only when it is a real day, not a half-typed one. */
const keepValidDay = (set: (day: Date) => void) => (value: Date | null) => {
  if (value && !Number.isNaN(value.getTime())) {
    set(value);
  }
};

/**
 * HR/ADMIN panel: the employee's tracked time over a range, priced at their hourly rate.
 * Only hourly pay is paid by the hour, so any other pay type explains where to set one.
 */
export function EmployeeEarningsPanel({ employeeId }: Readonly<{ employeeId: string }>) {
  const t = useT();
  const [from, setFrom] = useState(() => startOfMonth(new Date()));
  const [to, setTo] = useState(() => endOfMonth(new Date()));
  const { data, loading, error } = useEmployeeEarningsQuery({
    variables: {
      employeeId,
      from: startOfDay(from).toISOString(),
      to: endOfDay(to).toISOString(),
    },
    fetchPolicy: 'cache-and-network',
  });
  const earnings = data?.employeeEarnings;

  let body = <Skeleton variant="rounded" height={56} />;
  if (error) {
    body = <Alert severity="error">{error.message}</Alert>;
  } else if (earnings && earnings.payType !== PayType.Hourly) {
    body = (
      <EmptyState
        icon={<PaymentsOutlinedIcon />}
        title="Earnings need an hourly pay rate"
        description="Set the pay type to Hourly with a rate in Edit details → Compensation."
      />
    );
  } else if (earnings) {
    body = <EarningsFacts earnings={earnings} />;
  }

  return (
    <Box sx={panel} aria-busy={loading}>
      <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 1.5 }}
      >
        <Heading level={6}>{t('Earnings')}</Heading>
        <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <DatePicker
            label={t('From')}
            value={from}
            maxDate={to}
            onChange={keepValidDay(setFrom)}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label={t('To')}
            value={to}
            minDate={from}
            onChange={keepValidDay(setTo)}
            slotProps={{ textField: { size: 'small' } }}
          />
        </Flex>
      </Flex>
      {body}
    </Box>
  );
}
