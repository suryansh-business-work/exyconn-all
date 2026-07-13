import { Box, Grid, Text } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { glass } from '@/components/glass/glass';
import { useListPoliciesQuery } from '@/graphql/generated';
import { PolicyCard, type Policy } from './PolicyCard';

/** Employee self-service: browse published company HR policies & guidelines. */
export function PoliciesPage() {
  const { data, loading } = useListPoliciesQuery({ fetchPolicy: 'cache-and-network' });
  const policies = (data?.listPolicies ?? []) as Policy[];

  return (
    <Box>
      <PageHeader title="Policies" subtitle="Company HR policies & guidelines" />
      {loading && policies.length === 0 ? (
        <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
          <Text color="text.secondary">Loading…</Text>
        </Box>
      ) : policies.length === 0 ? (
        <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
          <Text color="text.secondary">No policies published yet.</Text>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {policies.map((policy) => (
            <Grid item xs={12} sm={6} md={4} key={policy.id}>
              <PolicyCard policy={policy} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
