import { Pressable } from 'react-native';
import { XStack } from 'tamagui';
import { formatMonthLabel } from '@exyconn/tracker-core';
import { shiftMonth } from '../../lib/report/month';
import { useThemeColor } from '../../theme/useThemeColor';
import { Icon, type IconName } from '../ui/Icon';
import { Body } from '../ui/Typography';

interface Props {
  month: Date;
  canGoForward: boolean;
  onChange: (month: Date) => void;
}

interface StepProps {
  label: string;
  icon: IconName;
  disabled?: boolean;
  onPress: () => void;
}

function StepButton({ label, icon, disabled = false, onPress }: Readonly<StepProps>) {
  const muted = useThemeColor('muted');
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Icon name={icon} size={26} color={disabled ? muted : undefined} />
    </Pressable>
  );
}

/** Prev / next month navigation with the month label between them. */
export function MonthSwitcher({ month, canGoForward, onChange }: Readonly<Props>) {
  return (
    <XStack alignItems="center" justifyContent="center" gap="$3">
      <StepButton
        label="Previous month"
        icon="chevron-left"
        onPress={() => onChange(shiftMonth(month, -1))}
      />
      <Body
        fontWeight="700"
        minWidth={148}
        textAlign="center"
        accessibilityRole="header"
        accessibilityLiveRegion="polite"
      >
        {formatMonthLabel(month)}
      </Body>
      <StepButton
        label="Next month"
        icon="chevron-right"
        disabled={!canGoForward}
        onPress={() => onChange(shiftMonth(month, 1))}
      />
    </XStack>
  );
}
