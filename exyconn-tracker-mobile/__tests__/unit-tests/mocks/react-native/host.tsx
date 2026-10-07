import { useCallback, useEffect, useRef, type ReactNode, type Ref } from 'react';
import { domA11yProps, type NativeHostProps } from './host-props';

export interface LayoutEvent {
  nativeEvent: { layout: { x: number; y: number; width: number; height: number } };
}

export interface HostProps extends NativeHostProps {
  children?: ReactNode;
  style?: unknown;
  onLayout?: (event: LayoutEvent) => void;
  onTouchStart?: () => void;
  ref?: Ref<HostElement>;
}

/** A DOM element carrying the measuring methods a native host instance has. */
export type HostElement = HTMLElement & {
  measure: (cb: (...frame: number[]) => void) => void;
  measureInWindow: (cb: (...frame: number[]) => void) => void;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

/**
 * The ref for a host element: gives the DOM node RN's `measure`/`measureInWindow` (read from
 * its bounding box) and routes `rnTest.layout(...)` to `onLayout`.
 */
export function useHostRef(ref: Ref<HostElement> | undefined, onLayout?: HostProps['onLayout']) {
  const node = useRef<HTMLElement | null>(null);
  const layoutRef = useRef(onLayout);
  layoutRef.current = onLayout;

  useEffect(() => {
    const element = node.current;
    const listener = (event: Event) => {
      const { detail } = event as CustomEvent<LayoutEvent['nativeEvent']['layout']>;
      layoutRef.current?.({ nativeEvent: { layout: detail } });
    };
    element?.addEventListener('rnlayout', listener);
    return () => element?.removeEventListener('rnlayout', listener);
  }, []);

  return useCallback(
    (element: HTMLElement | null) => {
      node.current = element;
      if (element === null) {
        assignRef(ref, null);
        return;
      }
      const host = Object.assign(element, {
        measure: (cb: (...frame: number[]) => void) => {
          const box = element.getBoundingClientRect();
          cb(box.x, box.y, box.width, box.height, box.x, box.y);
        },
        measureInWindow: (cb: (...frame: number[]) => void) => {
          const box = element.getBoundingClientRect();
          cb(box.x, box.y, box.width, box.height);
        },
      });
      assignRef(ref, host);
    },
    [ref],
  );
}

export function View({ children, onLayout, onTouchStart, ref, ...rest }: Readonly<HostProps>) {
  const hostRef = useHostRef(ref, onLayout);
  return (
    <div ref={hostRef} onTouchStart={onTouchStart} {...domA11yProps(rest)}>
      {children}
    </div>
  );
}

export function KeyboardAvoidingView(props: Readonly<HostProps & { behavior?: string }>) {
  return <View {...props} />;
}

export function Text({
  children,
  onPress,
  ref,
  ...rest
}: Readonly<HostProps & { onPress?: () => void; numberOfLines?: number }>) {
  const hostRef = useHostRef(ref);
  return (
    <span ref={hostRef} onClick={onPress} {...domA11yProps(rest)}>
      {children}
    </span>
  );
}
