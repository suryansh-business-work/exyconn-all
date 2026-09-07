import { Box, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { OnboardingItemList, canTickAny } from '@exyconn/shell/components/onboarding';
import type { OnboardingItem } from '@exyconn/shell/components/onboarding';
import { useSetOnboardingItemMutation } from '@exyconn/shell/graphql/generated';
import type { PagedOnboardingChecklistRow } from './onboarding-grid';

interface OnboardingDetailDrawerProps {
  checklist: PagedOnboardingChecklistRow | null;
  onClose: () => void;
  /** Hands back the updated checklist so the drawer and the grid both stay current. */
  onChanged: (updated: PagedOnboardingChecklistRow) => void;
}

/**
 * One joiner's checklist, open for HR to tick off.
 *
 * HR may tick any task, including the joiner's own — somebody has to be able to record that
 * a policy was signed on paper. The server applies the same rule.
 */
export function OnboardingDetailDrawer({
  checklist,
  onClose,
  onChanged,
}: Readonly<OnboardingDetailDrawerProps>) {
  const notify = useNotify();
  const { formatDate } = useSettings();
  const [setItem, { loading }] = useSetOnboardingItemMutation();

  const toggle = async (item: OnboardingItem, done: boolean) => {
    if (!checklist) return;
    try {
      const { data } = await setItem({
        variables: { checklistId: checklist.id, key: item.key, done },
      });
      if (data?.setOnboardingItem) {
        onChanged(data.setOnboardingItem);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update the task', 'error');
    }
  };

  return (
    <CrudDialog
      open={Boolean(checklist)}
      title={checklist ? `${checklist.employeeName} — onboarding` : 'Onboarding'}
      onClose={onClose}
    >
      {checklist && (
        <Box>
          <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            {`${checklist.templateName} · joined ${formatDate(checklist.joinDate)}`}
          </Text>
          <OnboardingItemList
            items={checklist.items}
            progressPercent={checklist.progressPercent}
            canTick={canTickAny}
            onToggle={(item, done) => {
              toggle(item, done).catch(() => undefined);
            }}
            busy={loading}
            formatDate={formatDate}
          />
        </Box>
      )}
    </CrudDialog>
  );
}
