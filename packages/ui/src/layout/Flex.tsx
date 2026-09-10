import { forwardRef, type CSSProperties } from 'react';
import MuiStack, { type StackProps } from '@mui/material/Stack';
import type { ResponsiveStyleValue } from '@mui/system';

/**
 * The flexbox properties Flex accepts directly.
 *
 * MUI 9 removed system props from Stack — `alignItems` and friends now only exist inside
 * `sx`. Flex keeps them as real props because a flex container that cannot be told how to
 * align is a worse component than the one it replaced, and because forcing three hundred
 * call sites into `sx={{ alignItems: … }}` would say the same thing in more characters.
 * They are merged into `sx` here, before the caller's own `sx`, so a caller can still win.
 */
export interface FlexAlignment {
  alignItems?: ResponsiveStyleValue<CSSProperties['alignItems']>;
  justifyContent?: ResponsiveStyleValue<CSSProperties['justifyContent']>;
  flexWrap?: ResponsiveStyleValue<CSSProperties['flexWrap']>;
  flexGrow?: ResponsiveStyleValue<CSSProperties['flexGrow']>;
  gap?: ResponsiveStyleValue<number | string>;
}

/**
 * Brand flex container — MUI Stack with opt-in flexbox wrapping. Without
 * `wrap`, behavior is byte-for-byte identical to a plain Stack (margin-based
 * spacing) so it's a safe drop-in rename. `wrap` switches to `useFlexGap`
 * (MUI's recommended pairing — margin-based spacing mis-renders at wrap
 * boundaries).
 */
export type FlexProps = StackProps &
  FlexAlignment & {
    wrap?: boolean;
  };

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  (
    { direction = 'row', wrap, alignItems, justifyContent, flexWrap, flexGrow, gap, sx, ...props },
    ref,
  ) => (
    <MuiStack
      ref={ref}
      direction={direction}
      useFlexGap={wrap}
      {...props}
      sx={[
        {
          alignItems,
          justifyContent,
          flexGrow,
          gap,
          flexWrap: flexWrap ?? (wrap ? 'wrap' : undefined),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  ),
);
Flex.displayName = 'Flex';
