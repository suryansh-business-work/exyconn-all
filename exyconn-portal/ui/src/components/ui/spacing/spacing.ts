import { spacing as pxSpacing } from '../tokens/tokens';

// Named spacing scale in raw px, for non-sx numeric gaps like Spacer — sx props
// like p/m/gap should keep using MUI's own multiplier system, not this.
export type SpaceSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const space: Record<SpaceSize, number> = {
  xs: pxSpacing(0.5),
  sm: pxSpacing(1),
  md: pxSpacing(2),
  lg: pxSpacing(3),
  xl: pxSpacing(4),
};
