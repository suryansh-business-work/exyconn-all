import type { ReactElement, ReactNode } from 'react';
import { alpha, Box, GlobalStyles } from '@exyconn/ui';

interface Props {
  children: ReactNode;
  /**
   * How much of the ground stays painted: 1 is solid, lower lets the desktop show through the
   * window's native material (see main/window-material.ts). Cards stay opaque either way.
   * The gallery window, which has no such setting, leaves it solid.
   */
  groundOpacity?: number;
}

/** Nothing under the frame may paint while it is see-through, or the desktop never shows. */
const CLEAR_PAGE = { 'html, body': { backgroundColor: 'transparent' } } as const;

/**
 * The app shell: a full-height flex column on the neutral ground, whose children own their own
 * scrolling. The brand colour is an accent here, not a wash over every surface.
 */
export default function AppFrame({ children, groundOpacity = 1 }: Readonly<Props>): ReactElement {
  const seeThrough = groundOpacity < 1;
  return (
    <Box
      sx={(theme) => ({
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: theme.palette.text.primary,
        backgroundColor: seeThrough
          ? alpha(theme.palette.background.default, groundOpacity)
          : theme.palette.background.default,
      })}
    >
      {seeThrough ? <GlobalStyles styles={CLEAR_PAGE} /> : null}
      {children}
    </Box>
  );
}
