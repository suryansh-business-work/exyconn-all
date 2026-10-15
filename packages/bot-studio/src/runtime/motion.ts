import { useMediaQuery } from '@exyconn/shell/components/ui';

/** How long a sent message waits before it reads delivered, then read (the ticks). */
export const TICK_TIMING = {
  deliveredMs: 350,
  readMs: 650,
} as const;

/** Whether the viewer asked for less motion. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
