import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';

interface Props {
  children: ReactNode;
}

/**
 * The vivid brand mesh the whole app floats on. It MUST carry the colour, because
 * `backdrop-filter` on the glass surfaces has nothing to blur otherwise.
 * Also the app shell: a flex column whose children own their own scrolling.
 */
export default function AppBackground({ children }: Readonly<Props>): JSX.Element {
  return (
    <Box
      sx={(theme) => ({
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.background.default,
        backgroundAttachment: 'fixed',
        backgroundImage: [
          `radial-gradient(1000px 620px at 8% -12%, ${alpha(theme.palette.primary.main, 0.55)}, transparent 62%)`,
          `radial-gradient(820px 520px at 104% 4%, ${alpha(theme.palette.secondary.main, 0.5)}, transparent 58%)`,
          `radial-gradient(760px 560px at 50% 118%, ${alpha(theme.palette.primary.light, 0.34)}, transparent 60%)`,
          `linear-gradient(155deg, ${alpha(theme.palette.secondary.dark, 0.28)}, transparent 55%)`,
        ].join(', '),
      })}
    >
      {children}
    </Box>
  );
}
