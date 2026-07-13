import type { ReactNode } from 'react';
import Box from '@mui/material/Box';

interface Props {
  children: ReactNode;
  maxWidth?: number;
}

/**
 * A scrollable, vertically centred column. `margin: auto` (not `align-items: center`)
 * so tall content still scrolls to its top instead of being clipped in a small window.
 */
export default function ScreenLayout({ children, maxWidth = 460 }: Readonly<Props>): JSX.Element {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
      }}
    >
      <Box sx={{ m: 'auto', width: '100%', maxWidth }}>{children}</Box>
    </Box>
  );
}
