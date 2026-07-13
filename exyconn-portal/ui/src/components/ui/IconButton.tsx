import { forwardRef } from 'react';
import MuiIconButton, { type IconButtonProps } from '@mui/material/IconButton';

/** Brand icon button — single wrapper around MUI IconButton. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => (
  <MuiIconButton ref={ref} {...props} />
));
IconButton.displayName = 'IconButton';

export type { IconButtonProps };
