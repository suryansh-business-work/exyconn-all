import { forwardRef } from 'react';
import MuiRadioGroup, { type RadioGroupProps } from '@mui/material/RadioGroup';

/** Brand radio group — single wrapper around MUI RadioGroup for app-wide defaults. */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>((props, ref) => (
  <MuiRadioGroup ref={ref} {...props} />
));
RadioGroup.displayName = 'RadioGroup';

export type { RadioGroupProps };
