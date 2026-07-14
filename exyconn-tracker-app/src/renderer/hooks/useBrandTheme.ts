import { useMemo } from 'react';
import type { Theme } from '@mui/material/styles';
import type { Branding } from '@shared/types';
import { buildTheme } from '../theme';

/**
 * The MUI theme built from the portal branding. The tracker state is republished every second,
 * so this is keyed on the four colours `buildTheme` actually reads — otherwise every tick would
 * rebuild the entire theme and re-render the whole tree.
 */
export default function useBrandTheme(branding: Branding | null): Theme {
  return useMemo(
    () => buildTheme(branding),
    [
      branding?.primaryColor,
      branding?.secondaryColor,
      branding?.backgroundColor,
      branding?.textColor,
    ],
  );
}
