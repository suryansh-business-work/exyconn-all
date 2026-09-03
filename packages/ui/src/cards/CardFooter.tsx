import { forwardRef } from 'react';
import MuiCardActions, { type CardActionsProps } from '@mui/material/CardActions';

/** Brand card footer — wraps MUI CardActions with default padding. */
export type CardFooterProps = CardActionsProps;

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({ sx, ...props }, ref) => (
  <MuiCardActions
    ref={ref}
    sx={[{ px: 2, pb: 2 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
