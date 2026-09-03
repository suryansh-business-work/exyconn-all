import { forwardRef } from 'react';
import MuiTypography, {
  type TypographyProps as MuiTypographyProps,
} from '@mui/material/Typography';

/** Heading levels 1-6, mapped to the matching semantic `<h1>`-`<h6>` tag. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends Omit<MuiTypographyProps, 'variant' | 'component'> {
  level?: HeadingLevel;
}

const VARIANTS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/** Semantic heading — renders the `<h{level}>` tag with the matching MUI variant. */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 2, ...props }, ref) => (
    <MuiTypography
      ref={ref}
      variant={VARIANTS[level - 1]}
      component={`h${level}` as const}
      {...props}
    />
  ),
);
Heading.displayName = 'Heading';
