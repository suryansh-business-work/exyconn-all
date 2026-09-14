import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the phone's "Reduce motion" (iOS) / "Remove animations" (Android) setting is on, kept
 * live while the app runs. Anything that moves only for effect — the tracking pulse, a sheet
 * sliding in — stays still when it is (WCAG 2.3.3).
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (live) {
          setReduce(enabled);
        }
      })
      .catch((cause: unknown) => console.error('Reading the reduce-motion setting failed', cause));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      live = false;
      subscription.remove();
    };
  }, []);

  return reduce;
}
