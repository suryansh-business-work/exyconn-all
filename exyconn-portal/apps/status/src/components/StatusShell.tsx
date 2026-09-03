import type { ReactNode } from 'react';
import { Box, Container } from '@exyconn/shell/components/ui';
import { StatusHeader } from './StatusHeader';
import { StatusFooter } from './StatusFooter';

/** Page frame every route on the status site renders inside. */
export function StatusShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <StatusHeader />
      <Box component="main" sx={{ flex: 1 }}>
        <Container sx={{ py: { xs: 3, md: 5 } }}>{children}</Container>
      </Box>
      <StatusFooter />
    </Box>
  );
}
