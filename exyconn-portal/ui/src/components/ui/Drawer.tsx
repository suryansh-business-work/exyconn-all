import { forwardRef } from 'react';
import MuiDrawer, { type DrawerProps } from '@mui/material/Drawer';

/** Brand drawer — single wrapper around MUI Drawer. */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>((props, ref) => (
  <MuiDrawer ref={ref} {...props} />
));
Drawer.displayName = 'Drawer';

export type { DrawerProps };
