import { Alert, Box, Divider, Skeleton } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { useDnsOverviewQuery } from '@exyconn/shell/graphql/generated';
import { NameserverPanel } from './NameserverPanel';
import { RecordsCompare } from './RecordsCompare';
import { ShiftPanel } from './ShiftPanel';

/** One domain: its nameservers and switch, the shift action, and both providers' records. */
export function DomainDnsView({ domain }: Readonly<{ domain: string }>) {
  const { data, loading, error, refetch } = useDnsOverviewQuery({
    variables: { domain },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
  const overview = data?.dnsOverview;

  if (error && !overview) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  if (!overview) {
    return <Skeleton variant="rounded" height={320} />;
  }
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={readingPanel}>
        <NameserverPanel overview={overview} onChanged={refetch} />
        <Divider sx={{ my: 2 }} />
        <ShiftPanel overview={overview} onChanged={refetch} />
      </Box>
      <Box sx={readingPanel}>
        <RecordsCompare
          records={overview.records}
          hasZone={Boolean(overview.zone)}
          loading={loading}
          onRefresh={() => refetch()}
        />
      </Box>
    </Box>
  );
}
