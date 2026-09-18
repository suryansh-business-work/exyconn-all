import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Grid, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import {
  useItOnboardingQuery,
  useItProvisionOnboardingMutation,
  useSetOnboardingItemMutation,
} from '@exyconn/shell/graphql/generated';
import { useRunAction } from '../../hooks/useRunAction';
import { JoinerCard, type JoinerRow } from './JoinerCard';

/**
 * IT › Employee Onboarding: new employee → laptop → email → applications → permissions. The
 * checklists are HR's; IT ticks its own items here and requests the standard applications,
 * which arrive pre-approved in Access Management for IT to carry out.
 */
export function OnboardingPage() {
  const t = useT();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, loading, error, refetch } = useItOnboardingQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [tick] = useSetOnboardingItemMutation();
  const [provision] = useItProvisionOnboardingMutation();
  const runAction = useRunAction(refetch);
  const joiners = data?.itOnboarding ?? [];

  const busyWhile = async (joiner: JoinerRow, action: () => Promise<unknown>, done: string) => {
    setBusyId(joiner.checklistId);
    await runAction(action, done);
    setBusyId(null);
  };

  let body = <Text color="text.secondary">{t('No joiners have IT tasks waiting.')}</Text>;
  if (error) {
    body = <Text color="error">{error.message}</Text>;
  } else if (loading && joiners.length === 0) {
    body = <Text color="text.secondary">{t('Loading…')}</Text>;
  } else if (joiners.length > 0) {
    body = (
      <Grid container spacing={1.5}>
        {joiners.map((joiner) => (
          <Grid key={joiner.checklistId} size={{ xs: 12, md: 6 }}>
            <JoinerCard
              joiner={joiner}
              busy={busyId === joiner.checklistId}
              onTick={(key, done) =>
                busyWhile(
                  joiner,
                  () => tick({ variables: { checklistId: joiner.checklistId, key, done } }),
                  done ? 'Task ticked off' : 'Task reopened',
                )
              }
              onProvision={() =>
                busyWhile(
                  joiner,
                  () => provision({ variables: { employeeId: joiner.employeeId } }),
                  'Access requested — carry it out in Access Management',
                )
              }
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Employee Onboarding"
        subtitle="Laptop, email, applications and permissions for everyone joining"
      />
      {body}
    </Box>
  );
}
