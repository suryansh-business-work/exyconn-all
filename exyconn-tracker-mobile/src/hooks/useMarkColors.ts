import type { DayMark } from '@exyconn/tracker-core';
import { useBrand } from '../theme/BrandProvider';
import { trackerDayStatus } from '../theme/tokens';

/**
 * The ring each calendar status wears, from the design system's shared tracker tokens — the
 * same hues the desktop and the portal draw: green completed, red short, blue leave, purple
 * holiday, grey week off, amber off-computer work.
 */
export function useMarkColors(): Readonly<Record<DayMark, string>> {
  return trackerDayStatus[useBrand().scheme];
}
