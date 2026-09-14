import { YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
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
  const t = useT();
  const caption =
    progressStyle === 'ring'
      ? t('Today’s progress is drawn as a ring, with the percentage inside it.')
      : t('Today’s progress is drawn as a bar, with what is left as a length.');
  const options = OPTIONS.map((option) => ({ ...option, label: t(option.label) }));
  return (
    <YStack gap="$2">
      <SegmentedControl
        kind="choice"
        full
        label={t('Today’s progress')}
        options={options}
        value={progressStyle}
        onChange={(next) => tracker.setPreferences({ progressStyle: next })}
      />
      <Caption>{caption}</Caption>
    </YStack>
  );
}
