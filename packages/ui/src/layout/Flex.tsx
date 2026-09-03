import { forwardRef } from 'react';
import MuiStack, { type StackProps } from '@mui/material/Stack';

/**
 * Brand flex container — MUI Stack with opt-in flexbox wrapping. Without
 * `wrap`, behavior is byte-for-byte identical to a plain Stack (margin-based
 * spacing) so it's a safe drop-in rename. `wrap` switches to `useFlexGap`
 * (MUI's recommended pairing — margin-based spacing mis-renders at wrap
 * boundaries).
 */
export type FlexProps = StackProps & {
  wrap?: boolean;
};

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({ direction = 'row', wrap, ...props }, ref) => (
    <MuiStack
      ref={ref}
      direction={direction}
      useFlexGap={wrap}
      flexWrap={wrap ? 'wrap' : undefined}
      {...props}
    />
  ),
);
Flex.displayName = 'Flex';
