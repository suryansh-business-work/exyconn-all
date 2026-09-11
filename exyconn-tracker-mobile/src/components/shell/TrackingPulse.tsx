import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { YStack } from 'tamagui';
import type { TrackerStatus } from '@exyconn/tracker-core';
import { useThemeColor, type ThemeColor } from '../../theme/useThemeColor';

/** What the dot means, per status. Only `tracking` animates. */
const LOOK: Readonly<Record<TrackerStatus, { tone: ThemeColor; label: string; live: boolean }>> = {
  'signed-out': { tone: 'muted', label: 'Signed out', live: false },
  'consent-required': { tone: 'warning', label: 'Waiting for your consent', live: false },
  idle: { tone: 'muted', label: 'Not tracking — nothing is being recorded', live: false },
  tracking: { tone: 'success', label: 'Tracking — recording your work', live: true },
  paused: { tone: 'warning', label: 'Paused — nothing is being recorded', live: false },
};

/** A slow, calm heartbeat — this sits in the header all day; anything faster reads as alarm. */
const PULSE_MS = 2000;
const DOT = 10;

interface Props {
  status: TrackerStatus;
}

/**
 * The always-visible answer to "is it recording right now?". A dot that pulsed while paused
 * would say the opposite of the truth — the one thing a monitoring app cannot afford — so only
 * `tracking` moves.
 */
export function TrackingPulse({ status }: Readonly<Props>) {
  const look = LOOK[status];
  const color = useThemeColor(look.tone);
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!look.live) {
      ring.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: PULSE_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [look.live, ring]);

  return (
    <YStack
      width={DOT * 2.4}
      height={DOT * 2.4}
      alignItems="center"
      justifyContent="center"
      accessibilityRole="image"
      accessibilityLabel={look.label}
    >
      {look.live ? (
        <Animated.View
          style={{
            position: 'absolute',
            width: DOT,
            height: DOT,
            borderRadius: DOT / 2,
            backgroundColor: color,
            opacity: ring.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0, 0] }),
            transform: [
              { scale: ring.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 2.4, 2.4] }) },
            ],
          }}
        />
      ) : null}
      <YStack width={DOT} height={DOT} borderRadius={DOT / 2} backgroundColor={color} />
    </YStack>
  );
}
