import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { XStack, YStack } from 'tamagui';
import { ON_LIGHT } from '../../theme/palette';
import { radius, trackerProgressGradient } from '../../theme/tokens';
import { Body } from '../ui/Typography';

const HEIGHT = 44;
/** Pinned left and stretched past the fill; no `right`, so its own width decides its size. */
const UNDER_FILL = { position: 'absolute', left: 0, top: 0, bottom: 0 } as const;
/** Below this fill the inside label would be clipped, so it is left out. */
const LABEL_MIN_PERCENT = 30;
/** Past this fill the trailing text sits on the gradient, and takes the gradient's dark ink. */
const TRAILING_ON_FILL_PERCENT = 75;

interface Props {
  /** 0–100. */
  percent: number;
  /** Written inside the fill, e.g. "Worked". */
  label: string;
  /** Written at the right of the track, e.g. "of 8h 0m". */
  trailing: string;
  accessibilityLabel: string;
}

/**
 * A pill track filled coral → amber → green — the desktop's bar. The gradient spans the whole
 * track and the fill uncovers it, so how far the fill has got also shows as its colour.
 */
export function GradientBar({ percent, label, trailing, accessibilityLabel }: Readonly<Props>) {
  const clamped = Math.min(100, Math.max(0, percent));
  const [from, via, to] = trackerProgressGradient;
  return (
    <XStack
      height={HEIGHT}
      borderRadius={radius.pill}
      backgroundColor="$hairline"
      overflow="hidden"
      alignItems="center"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      <YStack
        width={`${clamped}%`}
        height="100%"
        borderRadius={radius.pill}
        overflow="hidden"
        justifyContent="center"
      >
        {/* Sized to the whole track (100 / fill), so the fill shows only its share of it. */}
        <Svg
          style={UNDER_FILL}
          width={clamped > 0 ? `${(100 / clamped) * 100}%` : '100%'}
          height="100%"
        >
          <Defs>
            <LinearGradient id="day" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={from} />
              <Stop offset="0.5" stopColor={via} />
              <Stop offset="1" stopColor={to} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#day)" />
        </Svg>
        {clamped >= LABEL_MIN_PERCENT ? (
          <Body paddingHorizontal="$3.5" fontWeight="600" color={ON_LIGHT} numberOfLines={1}>
            {label}
          </Body>
        ) : null}
      </YStack>
      <YStack
        width={3}
        height={24}
        marginLeft="$1.5"
        borderRadius={radius.pill}
        backgroundColor="$ink"
      />
      <Body
        position="absolute"
        right={16}
        fontWeight="600"
        color={clamped >= TRAILING_ON_FILL_PERCENT ? ON_LIGHT : '$muted'}
        numberOfLines={1}
      >
        {trailing}
      </Body>
    </XStack>
  );
}
