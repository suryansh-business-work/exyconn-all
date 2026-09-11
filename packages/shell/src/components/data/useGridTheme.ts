import { useMemo } from 'react';
import { themeQuartz } from 'ag-grid-community';
import { CARD_RADIUS, fontSize, fontWeight, useTheme } from '@/components/ui';

/** ag-grid's Quartz theme painted from the active MUI theme, so the grid follows light/dark. */
export function useGridTheme() {
  const theme = useTheme();
  return useMemo(
    () =>
      themeQuartz.withParams({
        accentColor: theme.palette.primary.main,
        backgroundColor: theme.palette.background.paper,
        foregroundColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        headerBackgroundColor: theme.palette.background.default,
        headerTextColor: theme.palette.text.secondary,
        rowHoverColor: theme.palette.action.hover,
        fontFamily: theme.typography.fontFamily,
        fontSize: fontSize.sm,
        headerFontSize: fontSize.xs,
        headerFontWeight: fontWeight.bold,
        // A grid sits on the page as a card does, so it takes the card corner.
        wrapperBorderRadius: CARD_RADIUS,
      }),
    [theme],
  );
}
