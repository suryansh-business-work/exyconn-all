import { useT } from '@exyconn/i18n';
import { Grid, Skeleton, color } from '@exyconn/shell/components/ui';
import { StatCard } from '@exyconn/shell/components/dashboard/StatCard';
import type { MyLeaveBalancesQuery } from '@exyconn/shell/graphql/generated';

type Balance = MyLeaveBalancesQuery['myLeaveBalances'][number];

interface LeaveBalanceCardsProps {
  balances: readonly Balance[];
  /** True while the balances are being fetched: placeholder tiles hold their place. */
  loading?: boolean;
}

const PLACEHOLDERS = ['a', 'b', 'c', 'd'];

/**
 * One tile per leave type HR has given this employee for the current year — so a type HR
 * adds, or a quota it sets for their country, shows up here the next time they look.
 */
export function LeaveBalanceCards({ balances, loading = false }: Readonly<LeaveBalanceCardsProps>) {
  const t = useT();
  const year = new Date().getFullYear();
  const current = balances.filter((balance) => balance.year === year);
  if (loading && current.length === 0) {
    return (
      <Grid container spacing={2} sx={{ mb: 2 }} aria-busy="true">
        {PLACEHOLDERS.map((key) => (
          <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
            <Skeleton variant="rounded" height={88} />
          </Grid>
        ))}
      </Grid>
    );
  }
  if (current.length === 0) {
    return null;
  }
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {current.map((balance) => (
        <Grid key={balance.id} size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="{type} left"
            labelValues={{ type: balance.leaveTypeCode }}
            value={t('{available} of {total} days', {
              available: balance.available,
              total: balance.available + balance.used,
            })}
            accent={color.violet[400]}
          />
        </Grid>
      ))}
    </Grid>
  );
}
