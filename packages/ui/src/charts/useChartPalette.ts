import { useTheme } from '../styles';
import { chartPalette, type ChartPalette } from './palette';

/**
 * The chart palette for whichever mode the app is currently in.
 *
 * Dark mode is a *selected* palette — its own steps validated against the dark surface — not
 * an automatic inversion of the light one, which is how dark-mode charts usually end up
 * either invisible or fluorescent.
 *
 * The chrome (grid, axis text) comes from the theme rather than the palette file, so a chart's
 * gridlines are the same hairline grey as every other divider in the product.
 */
export function useChartPalette(): ChartPalette {
  const theme = useTheme();
  return chartPalette(
    theme.palette.mode === 'light' ? 'light' : 'dark',
    theme.palette.background.paper,
    theme.palette.divider,
    theme.palette.text.secondary,
    theme.palette.text.primary,
  );
}
