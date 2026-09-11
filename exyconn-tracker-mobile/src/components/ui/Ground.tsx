import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useBrand } from '../../theme/BrandProvider';
import { useThemeColor } from '../../theme/useThemeColor';

/** How strongly the brand colours show in the gradient before the plain ground goes over it. */
const WASH = 0.5;

/**
 * The ground behind every screen. Solid, it is the theme's plain app colour; with the
 * transparent background on, the workspace's brand gradient shows through that colour, as much
 * as the employee's opacity leaves room for. Cards stay opaque on top of either.
 */
export function Ground() {
  const { groundOpacity, primary, secondary } = useBrand();
  const app = useThemeColor('app');

  if (groundOpacity >= 1) {
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: app }]} />
    );
  }
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={primary} stopOpacity={WASH} />
          <Stop offset="1" stopColor={secondary} stopOpacity={WASH} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={app} />
      <Rect width="100%" height="100%" fill="url(#ground)" />
      <Rect width="100%" height="100%" fill={app} opacity={groundOpacity} />
    </Svg>
  );
}
