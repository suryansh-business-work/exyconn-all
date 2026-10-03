import React from 'react';
import Box from '@mui/material/Box';
import { ThemeProvider } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import { nightBand } from '../../theme/tokens';
import { nightTheme } from './nightTheme';
import { gutterSx, SHELL_MAX_WIDTH } from './styles';

interface NightBandProps {
  children: React.ReactNode;
  /** Decorative layer painted behind the content (e.g. a WebGL scene). */
  backdrop?: React.ReactNode;
  sx?: SxProps<Theme>;
  /** Accessible name of the band's landmark. */
  label?: string;
}

/**
 * A full-bleed night band (deep navy → violet with neon glows). Its contents render with
 * the dark theme in both colour modes, so text and controls keep their contrast.
 */
const NightBand: React.FC<Readonly<NightBandProps>> = ({ children, backdrop, sx, label }) => (
  <ThemeProvider theme={nightTheme}>
    <Box
      component="section"
      aria-label={label}
      sx={[
        {
          position: 'relative',
          isolation: 'isolate',
          overflow: 'hidden',
          background: nightBand,
          color: 'text.primary',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {backdrop && (
        <Box aria-hidden sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          {backdrop}
        </Box>
      )}
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: SHELL_MAX_WIDTH, mx: 'auto', ...gutterSx }}>{children}</Box>
    </Box>
  </ThemeProvider>
);

export default NightBand;
