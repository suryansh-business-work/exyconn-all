import type { ReactNode } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';

/**
 * A record's own page: the profile on the left (on top on a phone), and the tabs beside it.
 */
export function DetailLayout({
  aside,
  children,
}: Readonly<{ aside: ReactNode; children: ReactNode }>) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 340px) minmax(0, 1fr)' },
        alignItems: 'start',
      }}
    >
      <Box component="aside" sx={panel}>
        {aside}
      </Box>
      <Box component="section" sx={{ ...panel, minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}
