import { amber, blue, green, neutral, red, white } from '@exyconn/ui/tokens/colors.tokens';
import type { IconStatus } from '../types/meeting';

/**
 * The floating icon's and the toolbar badge's colours per state, from the design tokens.
 * Imported by path (not the `@exyconn/ui` barrel) so the service worker does not pull MUI in.
 * Each pairing keeps the ink at 4.5:1 or better on its fill.
 */
export const STATUS_COLORS: Readonly<Record<IconStatus, { fill: string; ink: string }>> = {
  IDLE: { fill: neutral[500], ink: white },
  ATTENTION: { fill: amber[400], ink: neutral[900] },
  ACTIVE: { fill: green[900], ink: white },
  PROCESSING: { fill: blue[700], ink: white },
  ERROR: { fill: red[950], ink: white },
};
