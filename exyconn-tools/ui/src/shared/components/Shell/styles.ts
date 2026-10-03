import type { SystemStyleObject } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import { fonts, night, radii, TAP_TARGET } from '../../theme/tokens';

/**
 * Frosted glass over the night band: translucent so the scene reads through, blurred so
 * the glow behind turns to haze. Body copy on it stays at fg-secondary or stronger (4.5:1).
 */
export const glassSx: SystemStyleObject<Theme> = {
  bgcolor: 'rgba(8, 9, 32, 0.58)',
  border: `1px solid ${night.line}`,
  borderRadius: radii.card,
  backdropFilter: { xs: 'blur(10px) saturate(140%)', md: 'blur(16px) saturate(150%)' },
  WebkitBackdropFilter: 'blur(12px) saturate(145%)',
};

/** Condensed uppercase display type, after exyconn.com's stage titles. */
export const displaySx: SystemStyleObject<Theme> = {
  fontFamily: fonts.sans,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '-0.035em',
  lineHeight: 0.95,
  textWrap: 'balance',
  overflowWrap: 'break-word',
  hyphens: 'auto',
};

/** The 16px phone gutter, widening on larger screens. */
export const gutterSx = { px: { xs: 2, sm: 3, md: 4 } } as const;

/** Page column width shared by header, bands and content. */
export const SHELL_MAX_WIDTH = 1280;

/** Square 44px header icon button with a hairline border. */
export const iconButtonSx = {
  width: TAP_TARGET,
  height: TAP_TARGET,
  border: 1,
  borderColor: 'divider',
  borderRadius: '12px',
} as const;
