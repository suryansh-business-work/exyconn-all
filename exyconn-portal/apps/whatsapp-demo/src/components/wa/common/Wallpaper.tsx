import { useMemo, type ReactNode } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import { useWaPalette } from '../../../theme/useWa';
import { WA_SIZE } from '../../../theme/wa.tokens';
import { doodleTile } from './doodle';

/** The chat background: the palette's wallpaper colour under a repeating doodle. */
export function Wallpaper({ children }: Readonly<{ children: ReactNode }>) {
  const c = useWaPalette();
  const tile = useMemo(() => doodleTile(c.doodle), [c.doodle]);
  return (
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: c.chatBackground,
        backgroundImage: tile,
        backgroundRepeat: 'repeat',
        backgroundSize: WA_SIZE.doodle,
      }}
    >
      {children}
    </Box>
  );
}
