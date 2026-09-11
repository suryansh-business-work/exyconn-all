import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/**
 * The width a view was actually given — an SVG chart is drawn to it, since a phone's column
 * is whatever the device and its orientation make it. 0 until the first layout.
 */
export function useMeasuredWidth(): [number, (event: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(Math.round(event.nativeEvent.layout.width));
  }, []);
  return [width, onLayout];
}
