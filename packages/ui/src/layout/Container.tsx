import { forwardRef } from 'react';
import MuiContainer, { type ContainerProps as MuiContainerProps } from '@mui/material/Container';

/** Brand container — single wrapper around MUI Container, defaulting to `maxWidth="lg"`. */
export type ContainerProps = MuiContainerProps;

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ maxWidth = 'lg', ...props }, ref) => <MuiContainer ref={ref} maxWidth={maxWidth} {...props} />,
);
Container.displayName = 'Container';
