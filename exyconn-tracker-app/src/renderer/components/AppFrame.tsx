import type { ReactElement, ReactNode } from 'react';
import { Box } from '@exyconn/ui';
interface Props {
  children: ReactNode;
}

/**
 * The app shell: a full-height flex column on a flat neutral background, whose children own
 * their own scrolling. Plain and opaque on purpose — the brand colour is an accent here, not
 * a wash over every surface.
 */
export default function AppFrame({ children }: Readonly<Props>): ReactElement {
  return (
    <Box
      sx={(theme) => ({
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.background.default,
      })}
    >
      {children}
    </Box>
  );
}
