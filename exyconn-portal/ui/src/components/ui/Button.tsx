import { forwardRef } from 'react';
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';

/**
 * Brand button — single wrapper around MUI Button for app-wide defaults.
 * Widened with anchor attributes so it can render as an external link
 * (`<Button href target rel>`), matching MUI Button's link behaviour.
 */
export type ButtonProps = MuiButtonProps & {
  href?: string;
  target?: string;
  rel?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <MuiButton ref={ref} {...(props as MuiButtonProps)} />
));
Button.displayName = 'Button';
