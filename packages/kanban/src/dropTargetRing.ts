import { borderWidth, readableAccent, type Theme } from '@exyconn/ui';

/**
 * The ring a column wears while it is the drop target, so where a card will land is never a
 * guess. In the column's own accent when it has one, else the primary colour.
 */
export const dropTargetRing = (accent?: string) => (theme: Theme) => {
  const color = accent === undefined ? theme.palette.primary.main : readableAccent(accent, theme);
  return { boxShadow: `inset 0 0 0 ${borderWidth.thick}px ${color}`, bgcolor: 'action.hover' };
};
