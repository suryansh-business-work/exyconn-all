import { forwardRef } from 'react';
import MuiCard, { type CardProps as MuiCardProps } from '@mui/material/Card';

/**
 * Brand card — strict superset of MuiCardProps (all props forwarded), with a
 * default border radius. Intended to REPLACE the raw pass-through `Card`
 * re-export currently in `ui/src/components/ui/index.ts` (a later integration
 * step wires that up).
 */
export type CardProps = MuiCardProps;

export const Card = forwardRef<HTMLDivElement, CardProps>(({ sx, ...props }, ref) => (
  <MuiCard
    ref={ref}
    sx={[{ borderRadius: 2 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    {...props}
  />
));
Card.displayName = 'Card';
