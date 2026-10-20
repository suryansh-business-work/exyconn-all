import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme, type SxProps, type Theme } from '@mui/material/styles';
import { fontWeight as fontWeights, numeric } from '../tokens/typography.token';
import { toSxArray } from '../layout/sx';

/**
 * Average glyph width as a share of the font size, padded so wide glyphs (₹, 0, W) still fit.
 * Configuration, not data: it is a property of the display face.
 */
const GLYPH_EM = 0.62;
/** Below this the figure stops shrinking and wraps instead, so it never becomes unreadable. */
const MIN_FONT = '1rem';

/** The font size that fits `chars` glyphs across the box, between the floor and `max`. */
export function fitFontSize(chars: number, max: string): string {
  const fitted = `calc(100cqi / ${(Math.max(chars, 1) * GLYPH_EM).toFixed(2)})`;
  return `clamp(${MIN_FONT}, ${fitted}, ${max})`;
}

export interface FitFigureProps {
  /** The figure itself; its length decides how far it shrinks. */
  value: string;
  /** Shown instead of the figure while it loads (e.g. a skeleton). */
  placeholder?: ReactNode;
  weight?: keyof typeof fontWeights;
  sx?: SxProps<Theme>;
}

/**
 * A stat tile's large figure, sized to its tile: the h4 size when it fits, smaller as the tile
 * narrows or the figure lengthens ("Not marked", "₹2,00,000"), so it never spills out of the
 * card. It measures its own width (a size container), so any tile can use it as is.
 */
export function FitFigure({ value, placeholder, weight = 'light', sx }: Readonly<FitFigureProps>) {
  const theme = useTheme();
  const max = String(theme.typography.h4.fontSize);
  return (
    <Box sx={[{ containerType: 'inline-size', minWidth: 0 }, ...toSxArray(sx)]}>
      <Typography
        variant="h4"
        component="p"
        sx={{
          fontSize: fitFontSize(value.length, max),
          fontWeight: fontWeights[weight],
          fontFeatureSettings: numeric.tabular,
          lineHeight: 1.15,
          overflowWrap: 'anywhere',
        }}
      >
        {placeholder ?? value}
      </Typography>
    </Box>
  );
}
