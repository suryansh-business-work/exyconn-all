import { useTheme } from 'tamagui';

/** The named chrome colours every theme defines (see tamagui.config.ts). */
export type ThemeColor =
  'app' | 'paper' | 'ink' | 'muted' | 'hairline' | 'success' | 'warning' | 'error';

/**
 * A theme colour as a raw value, for the places Tamagui's `$token` strings do not reach — a
 * vector icon's `color`, an SVG stroke, a native view.
 */
export function useThemeColor(name: ThemeColor): string {
  return useTheme()[name]?.val ?? '';
}
