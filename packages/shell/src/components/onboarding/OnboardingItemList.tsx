import { Box, Checkbox, Flex, LinearProgress, Text } from '@/components/ui';
import { StatusChip } from '@/components/data/StatusChip';
import type { OnboardingItem } from './onboarding.types';

interface OnboardingItemRowProps {
  item: OnboardingItem;
  /** False renders the tick read-only — somebody else owns this task. */
  editable: boolean;
  busy: boolean;
  onToggle: (item: OnboardingItem, done: boolean) => void;
  formatDate: (value: string) => string;
}

/** One task: who owns it, when it is due, and whether it is done. */
function OnboardingItemRow({
  item,
  editable,
  busy,
  onToggle,
  formatDate,
}: Readonly<OnboardingItemRowProps>) {
  const doneBy = item.doneByName ? ` · ticked by ${item.doneByName}` : '';
  return (
    <Flex direction="row" spacing={1} alignItems="flex-start" sx={{ py: 0.5 }}>
      <Checkbox
        checked={item.done}
        disabled={!editable || busy}
        onChange={(event) => onToggle(item, event.target.checked)}
        slotProps={{
          input: { 'aria-label': item.label }
        }}
      />
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Text weight="medium">{item.label}</Text>
        <Text size="caption" color="text.secondary">
          {`Due ${formatDate(item.dueOn)}${doneBy}`}
        </Text>
        {item.notes && (
          <Text size="caption" color="text.secondary">
            {item.notes}
          </Text>
        )}
      </Box>
      <StatusChip value={item.owner} />
    </Flex>
  );
}

interface OnboardingItemListProps {
  items: OnboardingItem[];
  progressPercent: number;
  /** Which tasks this viewer may tick. HR and IT may tick any; an employee only their own. */
  canTick: (item: OnboardingItem) => boolean;
  onToggle: (item: OnboardingItem, done: boolean) => void;
  busy?: boolean;
  formatDate: (value: string) => string;
}

/**
 * One onboarding checklist, as HR reads it in the drawer and the joiner reads it on their
 * own page. Shared so the two can never disagree about what is left to do.
 */
export function OnboardingItemList({
  items,
  progressPercent,
  canTick,
  onToggle,
  busy = false,
  formatDate,
}: Readonly<OnboardingItemListProps>) {
  const done = items.filter((item) => item.done).length;
  return (
    <Box>
      <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Text size="label">{`${done} of ${items.length} done`}</Text>
        <Text size="label">{`${progressPercent}%`}</Text>
      </Flex>
      <LinearProgress
        variant="determinate"
        value={progressPercent}
        aria-label="Onboarding progress"
        sx={{ mb: 1.5, borderRadius: 1, height: 6 }}
      />
      {items.map((item) => (
        <OnboardingItemRow
          key={item.key}
          item={item}
          editable={canTick(item)}
          busy={busy}
          onToggle={onToggle}
          formatDate={formatDate}
        />
      ))}
    </Box>
  );
}
