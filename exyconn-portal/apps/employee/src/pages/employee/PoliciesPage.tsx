import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Grid, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';

import { useMyPoliciesQuery } from '@exyconn/shell/graphql/generated';
import { PolicyCard, type Policy } from './PolicyCard';
import { PolicyReaderDialog } from './PolicyReaderDialog';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { CardGridSkeleton } from '@exyconn/shell/components/feedback/skeletons';

/**
 * Employee self-service: the policies this person is meant to read, and which of them still
 * need their signature.
 *
 * Unsigned ones come first — a list that buries the one thing you have to act on behind
 * nine you do not is a list nobody acts on.
 */
export function PoliciesPage() {
  const t = useT();
  const { data, loading, refetch } = useMyPoliciesQuery({ fetchPolicy: 'cache-and-network' });
  const [reading, setReading] = useState<Policy | null>(null);

  const policies = (data?.myPolicies ?? []) as Policy[];
  const outstanding = policies.filter((p) => p.requiresAcknowledgement && !p.acknowledged);
  const rest = policies.filter((p) => !outstanding.includes(p));
  const ordered = [...outstanding, ...rest];

  let outstandingNotice = t('{count} policies need your signature.', {
    count: outstanding.length,
  });
  if (outstanding.length === 1) {
    outstandingNotice = t('One policy needs your signature.');
  }

  return (
    <Box>
      <PageHeader title="Policies" subtitle="Company policies & guidelines" />

      {outstanding.length > 0 ? (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          {outstandingNotice}
        </Alert>
      ) : null}

      {ordered.length === 0 && loading && (
        <CardGridSkeleton count={3} avatar={false} label="Loading policies" />
      )}
      {ordered.length === 0 && !loading && (
        <Box sx={readingPanel}>
          <Text color="text.secondary">{t('No policies published yet.')}</Text>
        </Box>
      )}
      {ordered.length > 0 && (
        <Grid container spacing={2}>
          {ordered.map((policy) => (
            <Grid
              key={policy.id}
              size={{
                xs: 12,
                sm: 6,
                md: 4,
              }}
            >
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
