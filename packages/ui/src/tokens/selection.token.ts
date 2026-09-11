import { neutral, slate, white } from './colors.tokens';

/**
 * A selected tab, chip, nav row or calendar day: ink-on-paper inverted, per mode. One answer
 * for the portals and both trackers (the phone reads this file by path, so it imports no MUI).
 */
export const selectedInk = {
  light: { fill: slate[950], ink: white },
  dark: { fill: neutral[100], ink: neutral[900] },
} as const;
