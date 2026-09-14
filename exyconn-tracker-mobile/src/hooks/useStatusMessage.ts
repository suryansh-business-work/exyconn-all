import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/** Spread on the view showing a status, so TalkBack reads it when its content changes. */
export const LIVE_REGION = { accessibilityLiveRegion: 'polite' } as const;

/**
 * The app's one way to make a status message heard without moving focus (WCAG 4.1.3):
 * tracking started or paused, a sync result, a field error, a notice, the month on show.
 *
 * Android's TalkBack reads a live region by itself, so the returned props go on the view that
 * shows the message. iOS has no live regions, so VoiceOver is told the message directly — each
 * time it changes, and on first render only when `onMount` says the message is itself news
 * (a notice appearing), not a label that was already there (the month a screen opened on).
 */
export function useStatusMessage(
  message: string | null | undefined,
  onMount = false,
): typeof LIVE_REGION {
  const mounted = useRef(false);
  useEffect(() => {
    const first = !mounted.current;
    mounted.current = true;
    if (Platform.OS !== 'ios' || !message || (first && !onMount)) {
      return;
    }
    AccessibilityInfo.announceForAccessibility(message);
  }, [message, onMount]);
  return LIVE_REGION;
}
