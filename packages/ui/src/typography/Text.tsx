import { forwardRef } from 'react';
import MuiTypography, {
  type TypographyProps as MuiTypographyProps,
} from '@mui/material/Typography';
import { fontWeight } from '../tokens/tokens';

/** Inline text size scale, mapped to a MUI Typography variant. */
export type TextSize = 'sm' | 'md' | 'lg' | 'caption' | 'overline' | 'label';

/** Named font-weight, sourced from the shared tokens scale. */
export type TextWeight = keyof typeof fontWeight;

export interface TextProps extends Omit<MuiTypographyProps, 'variant'> {
  size?: TextSize;
  weight?: TextWeight;
}

const SIZE_VARIANT: Record<TextSize, MuiTypographyProps['variant']> = {
  sm: 'body2',
  md: 'body1',
  lg: 'subtitle1',
  caption: 'caption',
  overline: 'overline',
  label: 'subtitle2',
};

/** Inline text — sized via `size` and weighted via the shared `fontWeight` tokens. */
export const Text = forwardRef<HTMLSpanElement, TextProps>(
  ({ size = 'md', weight, component = 'span', sx, ...props }, ref) => (
    <MuiTypography
      ref={ref}
      variant={SIZE_VARIANT[size]}
      component={component}
      sx={[
        weight ? { fontWeight: fontWeight[weight] } : {},
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    />
  ),
);
Text.displayName = 'Text';
