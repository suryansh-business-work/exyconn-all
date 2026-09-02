import { forwardRef } from 'react';
import MuiSelect, { type SelectProps } from '@mui/material/Select';

/** Brand select — single wrapper around MUI Select for app-wide defaults. */
export const Select = forwardRef<HTMLDivElement, SelectProps>((props, ref) => (
  <MuiSelect ref={ref} {...props} />
));
Select.displayName = 'Select';

export type { SelectProps };
