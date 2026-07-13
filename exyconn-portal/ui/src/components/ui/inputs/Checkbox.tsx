import { forwardRef } from 'react';
import MuiCheckbox, { type CheckboxProps } from '@mui/material/Checkbox';

/** Brand checkbox — single wrapper around MUI Checkbox for app-wide defaults. */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>((props, ref) => (
  <MuiCheckbox ref={ref} {...props} />
));
Checkbox.displayName = 'Checkbox';

export type { CheckboxProps };
