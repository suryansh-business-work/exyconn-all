import { useState } from 'react';
import { Alert, Box, Grid, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useMyPoliciesQuery } from '@exyconn/shell/graphql/generated';
import { PolicyCard, type Policy } from './PolicyCard';
import { PolicyReaderDialog } from './PolicyReaderDialog';

/**
 * Employee self-service: the policies this person is meant to read, and which of them still
 * need their signature.
 *
 * Unsigned ones come first — a list that buries the one thing you have to act on behind
 * nine you do not is a list nobody acts on.
 */
export function PoliciesPage() {
  const { data, loading, refetch } = useMyPoliciesQuery({ fetchPolicy: 'cache-and-network' });
  const [reading, setReading] = useState<Policy | null>(null);

  const policies = (data?.myPolicies ?? []) as Policy[];
  const outstanding = policies.filter((p) => p.requiresAcknowledgement && !p.acknowledged);
  const rest = policies.filter((p) => !outstanding.includes(p));
  const ordered = [...outstanding, ...rest];

  return (
    <Box>
      <PageHeader title="Policies" subtitle="Company policies & guidelines" />

      {outstanding.length > 0 ? (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2, borderRadius: '4px' }}>
          {outstanding.length === 1
            ? 'One policy needs your signature.'
            : `${outstanding.length} policies need your signature.`}
        </Alert>
      ) : null}

      {ordered.length === 0 ? (
        <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
          <Text color="text.secondary">{loading ? 'Loading…' : 'No policies published yet.'}</Text>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {ordered.map((policy) => (
            <Grid item xs={12} sm={6} md={4} key={policy.id}>
              <PolicyCard policy={policy} onOpen={setReading} />
            </Grid>
          ))}
        </Grid>
      )}

      <PolicyReaderDialog
        policy={reading}
        onClose={() => setReading(null)}
        onSigned={() => {
          setReading(null);
          refetch().catch(() => undefined);
        }}
      />
    </Box>
  );
}
