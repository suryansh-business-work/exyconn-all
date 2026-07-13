import { forwardRef } from 'react';
import MuiRadio, { type RadioProps } from '@mui/material/Radio';

/** Brand radio — single wrapper around MUI Radio for app-wide defaults. */
export const Radio = forwardRef<HTMLButtonElement, RadioProps>((props, ref) => (
  <MuiRadio ref={ref} {...props} />
));
Radio.displayName = 'Radio';

export type { RadioProps };
