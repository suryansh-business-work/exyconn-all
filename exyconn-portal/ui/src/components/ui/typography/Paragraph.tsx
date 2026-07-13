import { forwardRef } from 'react';
import MuiTypography, {
  type TypographyProps as MuiTypographyProps,
} from '@mui/material/Typography';

export type ParagraphProps = Omit<MuiTypographyProps, 'variant' | 'component'>;

/** Block paragraph — renders `<p>` with a default bottom margin. */
export const Paragraph = forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ sx, ...props }, ref) => (
    <MuiTypography
      ref={ref}
      variant="body1"
      component="p"
      sx={[{ mb: 2 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...props}
    />
  ),
);
Paragraph.displayName = 'Paragraph';
