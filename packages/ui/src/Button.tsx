import { forwardRef, type ElementType } from 'react';
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';

/**
 * Brand button — single wrapper around MUI Button for app-wide defaults.
 * Widened with anchor attributes so it can render as an external link
 * (`<Button href target rel>`), matching MUI Button's link behaviour, and with
 * `component`/`to` so it can render as a router link for an in-app route —
 * a navigation control has to be a real link, not a button that navigates.
 */
export type ButtonProps = MuiButtonProps & {
  href?: string;
  target?: string;
  rel?: string;
  component?: ElementType;
  to?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <MuiButton ref={ref} {...(props as MuiButtonProps)} />
));
Button.displayName = 'Button';
