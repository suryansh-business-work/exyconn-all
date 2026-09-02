import { Box, Chip, Grid, Flex, Text, Paragraph } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { StatCard, type StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { LineChart } from '@exyconn/shell/components/dashboard/LineChart';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useHrDashboardQuery } from '@exyconn/shell/graphql/generated';

/** HR Dashboard — workforce counts and a real headcount-over-time chart. */
export function HrDashboardPage() {
  const { data, loading } = useHrDashboardQuery({ fetchPolicy: 'cache-and-network' });
  const dash = data?.hrDashboard;
  const headcount = dash?.headcount ?? [];

  const stats: StatItem[] = [
    { label: 'Total employees', value: String(dash?.totalEmployees ?? 0), accent: '#155dfc' },
    { label: 'Active', value: String(dash?.activeEmployees ?? 0), accent: '#22c55e' },
    { label: 'On leave', value: String(dash?.onLeave ?? 0), accent: '#f59e0b' },
  ];

  return (
    <Box>
      <PageHeader title="HR Dashboard" subtitle="Workforce overview" />

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {stats.map((stat) => (
          <Grid key={stat.label} item xs={12} md={4}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Box sx={[glass, { p: 2 }]}>
        <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Text size="label">Employee count over time</Text>
          <Chip label={`${headcount.length} months`} size="small" variant="outlined" />
        </Flex>
        {headcount.length > 1 ? (
          <LineChart
            labels={headcount.map((p) => p.label)}
            data={headcount.map((p) => p.count)}
            color="#155dfc"
          />
        ) : (
          <Paragraph color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            {loading ? 'Loading…' : 'Not enough history to chart yet.'}
          </Paragraph>
        )}
      </Box>
    </Box>
  );
}
