import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import type { AlertSeverity } from '@exyconn/tracker-core';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { useThemeColor, type ThemeColor } from '../../theme/useThemeColor';
import { Icon, type IconName } from './Icon';
import { Body, Caption } from './Typography';

const ICONS: Readonly<Record<AlertSeverity, IconName>> = {
  success: 'check-circle-outline',
  info: 'information-outline',
  warning: 'alert-outline',
  error: 'alert-circle-outline',
};

/** Info rides on the ink; the three states on the theme's own status hues. */
const TONES: Readonly<Record<AlertSeverity, ThemeColor>> = {
  success: 'success',
  info: 'ink',
  warning: 'warning',
  error: 'error',
};

interface Props {
  severity: AlertSeverity;
  /** The sentence that matters. */
  children: ReactNode;
  /** A second, quieter line — the why or the what-next. */
  detail?: string;
  icon?: IconName;
}

/**
 * An outlined notice — the MUI Alert the desktop uses, redrawn for the phone. Announced to
 * screen readers when it appears, because a notice is always something that just changed.
 */
export function Notice({ severity, children, detail, icon }: Readonly<Props>) {
  const tone = useThemeColor(TONES[severity]);
  return (
    <XStack
      borderWidth={1}
      borderColor={tone}
      borderRadius={TRACKER_RADIUS}
      padding="$3"
      gap="$3"
      alignItems="flex-start"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon name={icon ?? ICONS[severity]} size={20} color={tone} />
      <YStack flex={1} gap="$1">
        <Body color={tone}>{children}</Body>
        {detail === undefined ? null : <Caption>{detail}</Caption>}
      </YStack>
    </XStack>
  );
}
