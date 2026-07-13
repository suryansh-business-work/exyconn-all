import { forwardRef } from 'react';
import MuiSwitch, { type SwitchProps } from '@mui/material/Switch';

/** Brand switch — single wrapper around MUI Switch for app-wide defaults. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>((props, ref) => (
  <MuiSwitch ref={ref} {...props} />
));
Switch.displayName = 'Switch';

export type { SwitchProps };
