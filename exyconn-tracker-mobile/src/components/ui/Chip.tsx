import { XStack } from 'tamagui';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { useThemeColor, type ThemeColor } from '../../theme/useThemeColor';
import { Icon, type IconName } from './Icon';
import { Caption } from './Typography';

interface Props {
  label: string;
  tone?: ThemeColor;
  icon?: IconName;
}

/** A small outlined label — a status, a claim's decision, a day's activity. */
export function Chip({ label, tone = 'muted', icon }: Readonly<Props>) {
  const color = useThemeColor(tone);
  return (
    <XStack
      borderWidth={1}
      borderColor={color}
      borderRadius={TRACKER_RADIUS}
      paddingHorizontal="$2"
      paddingVertical="$1"
      gap="$1.5"
      alignItems="center"
      alignSelf="flex-start"
    >
      {icon === undefined ? null : <Icon name={icon} size={14} color={color} />}
      <Caption color={color} fontWeight="600">
        {label}
      </Caption>
    </XStack>
  );
}
