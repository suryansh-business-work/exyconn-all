import type { DayMark } from '@exyconn/tracker-core';
import { useBrand } from '../theme/BrandProvider';
import { useThemeColor } from '../theme/useThemeColor';

/**
 * The ring each calendar mark wears, as the desktop draws it: red for a short day, the accent
 * for leave, grey for a holiday, the hairline for the week off.
 */
export function useMarkColors(): Readonly<Record<DayMark, string>> {
  const brand = useBrand();
  const error = useThemeColor('error');
  const muted = useThemeColor('muted');
  const hairline = useThemeColor('hairline');
  return { SHORT: error, LEAVE: brand.primary, HOLIDAY: muted, WEEK_OFF: hairline };
}
