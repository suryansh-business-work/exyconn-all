import { Pressable } from 'react-native';
import type { ThemeMode } from '@exyconn/tracker-core';
import { tracker } from '../../tracker/instance';
import { Icon, type IconName } from '../ui/Icon';
import { RoundButton } from '../ui/RoundButton';

interface Step {
  /** Where a tap moves to — the three modes cycle, so none is ever unreachable. */
  next: ThemeMode;
  label: string;
  icon: IconName;
}

const STEPS: Readonly<Record<ThemeMode, Step>> = {
  system: { next: 'light', label: 'Matching your system', icon: 'brightness-auto' },
  light: { next: 'dark', label: 'Light', icon: 'white-balance-sunny' },
  dark: { next: 'system', label: 'Dark', icon: 'weather-night' },
};

interface Props {
  mode: ThemeMode;
  /** The page header's round paper button, instead of a bare icon. */
  round?: boolean;
}

/**
 * Light/dark for screens without room for the settings picker — one button cycling system →
 * light → dark. It writes the same install preference Settings does.
 */
export function ThemeToggle({ mode, round = false }: Readonly<Props>) {
  const step = STEPS[mode];
  const hint = `Theme: ${step.label}. Switch to ${STEPS[step.next].label.toLowerCase()}.`;
  const cycle = (): void => {
    tracker.setPreferences({ themeMode: step.next });
  };
  if (round) {
    return (
      <RoundButton label={hint} onPress={cycle}>
        <Icon name={step.icon} />
      </RoundButton>
    );
  }
  return (
    <Pressable onPress={cycle} accessibilityRole="button" accessibilityLabel={hint} hitSlop={10}>
      <Icon name={step.icon} />
    </Pressable>
  );
}
