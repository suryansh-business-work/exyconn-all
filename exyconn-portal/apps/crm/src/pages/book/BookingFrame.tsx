import type { ReactNode } from 'react';
import { Box, Paper } from '@exyconn/shell/components/ui';
import { BookingBrand, BookingPrivacyNote, type Brand } from './BookingBrand';

interface BookingFrameProps {
  /** The company whose page this is; its logo heads the page once it has loaded. */
  brand?: Brand;
  aside?: ReactNode;
  children: ReactNode;
}

/**
 * The card a public booking page sits in, centred under the company's logo like a scheduling
 * site: a summary column beside the step the visitor is on, stacked on a phone.
 */
export function BookingFrame({ brand, aside, children }: Readonly<BookingFrameProps>) {
  return (
    <Box
      component="main"
      sx={{ minHeight: '100dvh', bgcolor: 'background.default', py: { xs: 2, md: 6 }, px: 2 }}
    >
      {brand && <BookingBrand brand={brand} />}
      <Paper
        elevation={0}
        sx={{
          maxWidth: aside ? 1060 : 720,
          mx: 'auto',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: aside ? 'minmax(260px, 340px) 1fr' : '1fr' },
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          borderTop: 4,
          borderTopColor: 'primary.main',
          boxShadow: 3,
        }}
      >
        {aside && (
          <Box
            component="aside"
            sx={{
              p: { xs: 2, md: 4 },
              bgcolor: 'action.hover',
              borderRight: { md: 1 },
              borderBottom: { xs: 1, md: 0 },
              borderColor: 'divider',
            }}
          >
            {aside}
          </Box>
        )}
        <Box component="section" sx={{ p: { xs: 2, md: 4 }, minWidth: 0 }}>
          {children}
        </Box>
      </Paper>
      <BookingPrivacyNote />
    </Box>
  );
}
