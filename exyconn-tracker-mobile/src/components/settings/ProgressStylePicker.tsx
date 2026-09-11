import { YStack } from 'tamagui';
import type { ProgressStyle } from '@exyconn/tracker-core';
import { tracker } from '../../tracker/instance';
import { Caption } from '../ui/Typography';
import { SegmentedControl, type SegmentOption } from '../ui/SegmentedControl';

const OPTIONS: readonly SegmentOption<ProgressStyle>[] = [
  { value: 'bar', label: 'Bar', icon: 'ray-start-end' },
  { value: 'ring', label: 'Ring', icon: 'chart-donut' },
];

interface Props {
  progressStyle: ProgressStyle;
}

/**
 * Whether today's progress is a bar across the card or a ring around the figure.
 *
 * Both draw the same number from the same source. Which one is easier to read at a glance is
 * a fact about the person looking at it, so it is theirs to set rather than ours to decide.
 */
export function ProgressStylePicker({ progressStyle }: Readonly<Props>) {
  const caption =
    progressStyle === 'ring'
      ? 'Today’s progress is drawn as a ring, with the percentage inside it.'
      : 'Today’s progress is drawn as a bar, with what is left as a length.';
  return (
    <YStack gap="$2">
      <SegmentedControl
        kind="choice"
        full
        label="Today’s progress"
        options={OPTIONS}
        value={progressStyle}
        onChange={(next) => tracker.setPreferences({ progressStyle: next })}
      />
      <Caption>{caption}</Caption>
    </YStack>
  );
}
