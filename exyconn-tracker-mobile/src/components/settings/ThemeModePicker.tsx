import { YStack } from 'tamagui';
import type { ThemeMode } from '@exyconn/tracker-core';
import { tracker } from '../../tracker/instance';
import { Caption } from '../ui/Typography';
import { SegmentedControl, type SegmentOption } from '../ui/SegmentedControl';

const OPTIONS: readonly SegmentOption<ThemeMode>[] = [
  { value: 'system', label: 'System', icon: 'brightness-auto' },
  { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Dark', icon: 'weather-night' },
];

interface Props {
  mode: ThemeMode;
}

/**
 * Light, dark, or follow the phone.
 *
 * `System` is the default and stays first: a tracker that is open all day should match the
 * phone it is on without being asked. The other two are for when it should not.
 */
export function ThemeModePicker({ mode }: Readonly<Props>) {
  const caption =
    mode === 'system'
      ? 'Following your phone’s setting, and switching with it.'
      : 'Fixed to your choice, whatever the phone does.';
  return (
    <YStack gap="$2">
      <SegmentedControl
        kind="choice"
        full
        label="Appearance"
        options={OPTIONS}
        value={mode}
        onChange={(themeMode) => tracker.setPreferences({ themeMode })}
      />
      <Caption>{caption}</Caption>
    </YStack>
  );
}
