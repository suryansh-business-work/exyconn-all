import Svg, { Circle } from 'react-native-svg';
import { YStack } from 'tamagui';
import { useThemeColor } from '../../theme/useThemeColor';
import { Caption, Heading } from '../ui/Typography';

interface Props {
  /** 0-100. Anything outside is clamped by the caller, not here. */
  value: number;
  /** The figure drawn in the middle — the thing the ring is about. */
  label: string;
  /** One line under it, when the figure needs saying in words. */
  caption: string;
  /** The arc's colour — the brand accent, or the success hue once the day is done. */
  color: string;
  size?: number;
}

const STROKE = 6;

/**
 * A determinate ring with the figure in the middle of it.
 *
 * Two circles, not one: without a full-circle track underneath there is nothing to read the arc
 * AGAINST — 20% and 80% would look like two unrelated shapes rather than two positions on the
 * same journey. The arc starts at the top and runs clockwise, like a clock.
 *
 * Announced as an image with a spoken label: a ring is a picture of a number, and "62" alone
 * would leave out what the 62 is of.
 */
export function ProgressRing({ value, label, caption, color, size = 116 }: Readonly<Props>) {
  const track = useThemeColor('hairline');
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const centre = size / 2;

  return (
    <YStack
      width={size}
      height={size}
      alignItems="center"
      justifyContent="center"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label}. ${caption}`}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={track}
          strokeWidth={STROKE}
          fill="none"
        />
        {value > 0 ? (
          <Circle
            cx={centre}
            cy={centre}
            r={radius}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - value / 100)}
            transform={`rotate(-90 ${centre} ${centre})`}
          />
        ) : null}
      </Svg>
      <Heading accessibilityRole="none">{label}</Heading>
      <Caption>{caption}</Caption>
    </YStack>
  );
}
