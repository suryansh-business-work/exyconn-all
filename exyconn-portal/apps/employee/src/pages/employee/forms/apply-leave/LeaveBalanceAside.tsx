import { useT } from '@exyconn/i18n';
import { Alert, Box, Flex, Heading, Skeleton, Stack, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useMyLeaveBalancesQuery } from '@exyconn/shell/graphql/generated';
import { UNMETERED_TYPE } from './apply-leave.days';

interface LeaveBalanceAsideProps {
  /** The leave type picked in the form, or '' before one is. */
  type: string;
  /** Days the request covers; 0 until both dates are set. */
  days: number;
  /** Leave type code → the name HR gave it. */
  nameOf: (code: string) => string;
}

const SKELETON_ROWS = ['a', 'b', 'c'];

/** What the picked request does to the balance: enough days left, or not. */
function RequestImpact({
  type,
  days,
  available,
}: Readonly<{ type: string; days: number; available: number | null }>) {
  const t = useT();
  if (type === '' || days === 0) {
    return (
      <Text size="sm" color="text.secondary">
        {t('Pick a leave type and dates to see what this request uses.')}
      </Text>
    );
  }
  if (type === UNMETERED_TYPE) {
    return <Alert severity="info">{t('Unpaid leave does not use a balance.')}</Alert>;
  }
  if (available === null) {
    return (
      <Alert severity="warning">
        {t('You have no balance for this leave type yet. HR can add one.')}
      </Alert>
    );
  }
  const left = available - days;
  if (left < 0) {
    return (
      <Alert severity="error">
        {t(
          'This request is {days} days but only {available} are left. HR cannot approve more than you have.',
          { days, available },
        )}
      </Alert>
    );
  }
  return (
    <Alert severity="success">
      {t('This request uses {days} days; {left} will be left.', { days, left })}
    </Alert>
  );
}

/** Beside the apply form: every balance this year, and what the request being filled in uses. */
export function LeaveBalanceAside({ type, days, nameOf }: Readonly<LeaveBalanceAsideProps>) {
  const t = useT();
  const year = new Date().getFullYear();
  const { data, loading, error } = useMyLeaveBalancesQuery({ fetchPolicy: 'cache-and-network' });
  const balances = (data?.myLeaveBalances ?? []).filter((balance) => balance.year === year);
  const selected = balances.find((balance) => balance.leaveTypeCode === type);

  return (
    <Box component="aside" aria-label={t('Your leave balance')} sx={[panel, { height: '100%' }]}>
      <Heading level={6}>{t('Your leave balance {year}', { year })}</Heading>
      <Stack spacing={1} sx={{ my: 1.5 }}>
        {loading &&
          balances.length === 0 &&
          SKELETON_ROWS.map((key) => <Skeleton key={key} height={28} />)}
        {error && <Text color="error">{error.message}</Text>}
        {!loading && !error && balances.length === 0 && (
          <Text size="sm" color="text.secondary">
            {t('HR has not given you any leave balance yet.')}
          </Text>
        )}
        {balances.map((balance) => (
          <Flex
            key={balance.id}
            direction="row"
            justifyContent="space-between"
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: balance.leaveTypeCode === type ? 'action.selected' : 'transparent',
            }}
          >
            <Text size="sm">{nameOf(balance.leaveTypeCode)}</Text>
            <Text size="sm" weight="bold">
              {t('{available} of {total} days', {
                available: balance.available,
                total: balance.available + balance.used,
              })}
            </Text>
          </Flex>
        ))}
      </Stack>
      <RequestImpact type={type} days={days} available={selected?.available ?? null} />
    </Box>
  );
}
