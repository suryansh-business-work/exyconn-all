import { Button, Spinner } from 'tamagui';
import { useBrand } from '../../theme/BrandProvider';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { useThemeColor } from '../../theme/useThemeColor';
import { Icon, type IconName } from './Icon';

/** Filled in the brand colour, outlined, or plain text — the three weights a screen needs. */
export type ButtonTone = 'primary' | 'outlined' | 'text';

interface Props {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  icon?: IconName;
  disabled?: boolean;
  /** Shows a spinner in place of the icon and blocks presses, while an action is in flight. */
  busy?: boolean;
  /** A destructive action (sign out, withdraw) reads in the theme's error colour. */
  danger?: boolean;
  /** Fill the row — the default for a form's main action. */
  full?: boolean;
  /** Spoken instead of the label when the label alone would be ambiguous. */
  accessibilityLabel?: string;
}

/**
 * The app's one button. The brand accent comes from the portal at runtime, so it is applied
 * here — never hardcoded in a screen.
 */
export function AppButton({
  label,
  onPress,
  tone = 'primary',
  icon,
  disabled = false,
  busy = false,
  danger = false,
  full = false,
  accessibilityLabel,
}: Readonly<Props>) {
  const brand = useBrand();
  const error = useThemeColor('error');
  const accent = danger ? error : brand.primary;
  const filled = tone === 'primary';
  const ink = filled ? brand.onPrimary : accent;
  const inactive = disabled || busy;
  const glyph = icon === undefined ? undefined : <Icon name={icon} size={18} color={ink} />;

  return (
    <Button
      onPress={onPress}
      disabled={inactive}
      opacity={inactive ? 0.55 : 1}
      borderRadius={TRACKER_RADIUS}
      backgroundColor={filled ? accent : 'transparent'}
      borderColor={tone === 'outlined' ? accent : 'transparent'}
      borderWidth={tone === 'outlined' ? 1 : 0}
      color={ink}
      pressStyle={{ opacity: 0.8 }}
      icon={busy ? <Spinner color={ink} /> : glyph}
      width={full ? '100%' : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy }}
    >
      {label}
    </Button>
  );
}
