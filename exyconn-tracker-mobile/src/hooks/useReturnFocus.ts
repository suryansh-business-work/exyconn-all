import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { AccessibilityInfo, Platform, type HostInstance, type Text } from 'react-native';

/**
 * How long an Android dialog takes to leave the screen. TalkBack drops a focus request aimed
 * at the window underneath while the dialog is still attached, so the request waits it out.
 */
const ANDROID_DISMISS_MS = 350;

/** Moves the screen reader's cursor to `target`, if it is still on screen. */
function moveFocus(target: HostInstance | null): void {
  if (target?.isConnected === true) {
    AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
  }
}

export interface PopupFocus {
  /** Goes on the pop-up's title: the screen reader starts reading there when it opens. */
  titleRef: RefObject<Text | null>;
  /** Spread on the `Modal`. */
  modalProps: { onShow: () => void; onDismiss: () => void };
}

/**
 * The app's one focus rule for pop-ups (WCAG 2.4.3): on open the screen reader lands on the
 * pop-up's title, and on close it goes back to the control that opened it — not to the top
 * of the screen, which would make someone walk the whole page again to find their place.
 *
 * iOS says when its modal has gone (`onDismiss`); Android has no such event, so the return
 * waits for the dialog's exit instead. The pop-up must keep its `Modal` mounted with
 * `visible={open}` — an unmounted modal never reports its dismissal.
 */
export function useReturnFocus(
  open: boolean,
  returnFocusTo: RefObject<HostInstance | null>,
): PopupFocus {
  const titleRef = useRef<Text>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    const closed = wasOpen.current && !open;
    wasOpen.current = open;
    if (!closed || Platform.OS === 'ios') {
      return undefined;
    }
    const timer = globalThis.setTimeout(() => moveFocus(returnFocusTo.current), ANDROID_DISMISS_MS);
    return () => globalThis.clearTimeout(timer);
  }, [open, returnFocusTo]);

  const modalProps = useMemo(
    () => ({
      onShow: () => moveFocus(titleRef.current),
      onDismiss: () => moveFocus(returnFocusTo.current),
    }),
    [returnFocusTo],
  );

  return { titleRef, modalProps };
}
