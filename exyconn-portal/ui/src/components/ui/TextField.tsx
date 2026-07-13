import { forwardRef } from 'react';
import MuiTextField, { type TextFieldProps } from '@mui/material/TextField';

/** Brand text field — single wrapper around MUI TextField (theme sets size). */
export const TextField = forwardRef<HTMLDivElement, TextFieldProps>((props, ref) => (
  <MuiTextField ref={ref} {...props} />
));
TextField.displayName = 'TextField';

export type { TextFieldProps };
