import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { useThemeColor } from '../../theme/useThemeColor';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Props {
  name: IconName;
  size?: number;
  /** A raw colour (the brand accent). Defaults to the theme's ink. */
  color?: string;
  /** Screen readers skip a decorative icon; label one that carries meaning on its own. */
  label?: string;
}

/**
 * Every icon in the app — Material Design icons from @expo/vector-icons, the same family the
 * desktop tracker draws with @mui/icons-material, so a glyph means the same thing in both apps.
 */
export function Icon({ name, size = 20, color, label }: Readonly<Props>) {
  const ink = useThemeColor('ink');
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color ?? ink}
      accessibilityLabel={label}
      accessibilityElementsHidden={label === undefined}
      importantForAccessibility={label === undefined ? 'no-hide-descendants' : 'yes'}
    />
  );
}
