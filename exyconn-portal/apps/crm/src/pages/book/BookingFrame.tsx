import type { ReactNode } from 'react';
import { Box, Paper } from '@exyconn/shell/components/ui';

/**
 * The white card a public booking page sits in, centred on the page like a scheduling site:
 * a summary column beside the step the visitor is on, stacked on a phone.
 */
export function BookingFrame({
  aside,
  children,
}: Readonly<{ aside?: ReactNode; children: ReactNode }>) {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', py: { xs: 2, md: 6 }, px: 2 }}>
      <Paper
        variant="outlined"
        sx={{
          maxWidth: aside ? 1060 : 720,
          mx: 'auto',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: aside ? 'minmax(260px, 360px) 1fr' : '1fr' },
          overflow: 'hidden',
        }}
      >
        {aside && (
          <Box
            component="aside"
            sx={{
              p: { xs: 2, md: 3 },
              borderRight: { md: 1 },
              borderBottom: { xs: 1, md: 0 },
              borderColor: 'divider',
            }}
          >
            {aside}
          </Box>
        )}
        <Box component="main" sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
          {children}
        </Box>
      </Paper>
    </Box>
  );
}
