import { forwardRef } from 'react';
import MuiCard, { type CardProps as MuiCardProps } from '@mui/material/Card';
import { CARD_RADIUS } from '../tokens/border.token';

/**
 * Brand card — strict superset of MuiCardProps (all props forwarded), with the card corner
 * (`CARD_RADIUS`, in px — a string, since a number in `sx` would multiply the theme radius).
 */
export type CardProps = MuiCardProps;

export const Card = forwardRef<HTMLDivElement, CardProps>(({ sx, ...props }, ref) => (
  <MuiCard
    ref={ref}
    sx={[{ borderRadius: `${CARD_RADIUS}px` }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    {...props}
  />
));
Card.displayName = 'Card';
