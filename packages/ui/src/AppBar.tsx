import { forwardRef } from 'react';
import MuiAppBar, { type AppBarProps } from '@mui/material/AppBar';

/** Brand app bar — defaults to a flat, inherit-colored fixed bar. */
export const AppBar = forwardRef<HTMLDivElement, AppBarProps>(
  ({ position = 'fixed', elevation = 0, color = 'inherit', ...rest }, ref) => (
    <MuiAppBar ref={ref} position={position} elevation={elevation} color={color} {...rest} />
  ),
);
AppBar.displayName = 'AppBar';

export type { AppBarProps };
