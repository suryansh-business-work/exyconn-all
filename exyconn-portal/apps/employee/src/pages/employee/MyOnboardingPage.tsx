import { Alert, Box, CircularProgress, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { OnboardingItemList, canTickOwn } from '@exyconn/shell/components/onboarding';
import type { OnboardingItem } from '@exyconn/shell/components/onboarding';
import {
  useMyOnboardingQuery,
  useSetOnboardingItemMutation,
} from '@exyconn/shell/graphql/generated';

/**
 * My Workspace › My Onboarding — the joiner's own checklist.
 *
 * Every task is shown, including the ones HR and IT owe them: the point of the page is
 * knowing where their first days stand, not only what is left on their own plate. Only the
 * tasks the checklist asks THEM to do can be ticked, which is what the server allows too.
 */
export function MyOnboardingPage() {
  const notify = useNotify();
  const { formatDate } = useSettings();
  const { data, loading, error, refetch } = useMyOnboardingQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [setItem, { loading: saving }] = useSetOnboardingItemMutation();
  const checklist = data?.myOnboarding;

  const toggle = async (item: OnboardingItem, done: boolean) => {
    if (!checklist) return;
    try {
      await setItem({ variables: { checklistId: checklist.id, key: item.key, done } });
      await refetch();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update the task', 'error');
    }
  };

  return (
    <Box>
      <PageHeader title="My Onboarding" subtitle="Everything to settle in your first days" />
      {error && <Alert severity="error">{error.message}</Alert>}
      {loading && !data && <CircularProgress size={24} />}
      {data && !checklist && (
        <Box sx={[glass, { p: 3 }]}>
          <Text weight="medium" sx={{ display: 'block', mb: 0.5 }}>
            Nothing to do here yet
          </Text>
          <Text size="sm" color="text.secondary">
            HR has not started an onboarding checklist for you. When they do, everything you need
            for your first days will appear here.
          </Text>
        </Box>
      )}
      {checklist && (
        <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
          <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            {`${checklist.templateName} · from ${formatDate(checklist.joinDate)}`}
          </Text>
          <OnboardingItemList
            items={checklist.items}
            progressPercent={checklist.progressPercent}
            canTick={canTickOwn}
            onToggle={(item, done) => {
              toggle(item, done).catch(() => undefined);
            }}
            busy={saving}
            formatDate={formatDate}
          />
        </Box>
      )}
    </Box>
  );
}
