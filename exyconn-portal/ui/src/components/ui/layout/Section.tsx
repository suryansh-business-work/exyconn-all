import { forwardRef } from 'react';
import MuiBox, { type BoxProps } from '@mui/material/Box';

/** Brand section — MUI Box rendered as a `<section>` with default vertical padding. */
export type SectionProps = BoxProps;

export const Section = forwardRef<HTMLElement, SectionProps>(({ sx, ...props }, ref) => (
  <MuiBox
    ref={ref}
    component="section"
    sx={[{ py: 4 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    {...props}
  />
));
Section.displayName = 'Section';
