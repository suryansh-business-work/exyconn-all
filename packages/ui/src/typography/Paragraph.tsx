import { forwardRef } from 'react';
import MuiTypography, {
  type TypographyProps as MuiTypographyProps,
} from '@mui/material/Typography';
import { toSxArray } from '../layout/sx';
import { InlineTextContext } from './inlineText';

export type ParagraphProps = Omit<MuiTypographyProps, 'variant' | 'component'>;

/** Block paragraph — renders `<p>` with a default bottom margin. */
export const Paragraph = forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ sx, children, ...props }, ref) => (
    <MuiTypography
      ref={ref}
      variant="body1"
      component="p"
      sx={[{ mb: 2 }, ...toSxArray(sx)]}
      {...props}
    >
      <InlineTextContext.Provider value>{children}</InlineTextContext.Provider>
    </MuiTypography>
  ),
);
Paragraph.displayName = 'Paragraph';
