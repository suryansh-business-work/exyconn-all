import { forwardRef, useContext } from 'react';
import MuiTypography, {
  type TypographyProps as MuiTypographyProps,
} from '@mui/material/Typography';
import { fontWeight } from '../tokens/typography.token';
import { toSxArray } from '../layout/sx';
import { InlineTextContext } from './inlineText';

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

/**
 * Text — sized via `size` and weighted via the shared `fontWeight` tokens. A line of its own,
 * unless it sits inside other text (see InlineTextContext); `sx.display` overrides either.
 */
export const Text = forwardRef<HTMLSpanElement, TextProps>(
  ({ size = 'md', weight, component = 'span', sx, children, ...props }, ref) => {
    const inline = useContext(InlineTextContext);
    return (
      <MuiTypography
        ref={ref}
        variant={SIZE_VARIANT[size]}
        component={component}
        sx={[
          inline ? {} : { display: 'block' },
          weight ? { fontWeight: fontWeight[weight] } : {},
          ...toSxArray(sx),
        ]}
        {...props}
      >
        <InlineTextContext.Provider value>{children}</InlineTextContext.Provider>
      </MuiTypography>
    );
  },
);
Text.displayName = 'Text';
