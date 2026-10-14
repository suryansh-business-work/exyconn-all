import { useMediaQuery, useTheme } from '@exyconn/shell/components/ui';
import { WA_DARK, WA_LIGHT, type WaPalette } from './wa.tokens';

/** The skin's palette for the portal's current colour mode (which follows the system by default). */
export function useWaPalette(): WaPalette {
  return useTheme().palette.mode === 'dark' ? WA_DARK : WA_LIGHT;
}

/** Below this the app is the phone app: one screen at a time, list then chat. */
export function useCompact(): boolean {
  return useMediaQuery(useTheme().breakpoints.down('md'));
}

/** Whether the viewer asked for less motion. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
