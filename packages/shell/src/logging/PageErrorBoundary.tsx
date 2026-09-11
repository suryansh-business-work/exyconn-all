import type { ReactNode } from 'react';
import { LogErrorBoundary } from '@exyconn/logger/react';
import { Alert, Box, Button, Stack, Typography } from '@/components/ui';
import { portalLogger } from './portalLogger';

interface FallbackProps {
  error: Error;
  onRetry: () => void;
}

function PageCrashed({ error, onRetry }: Readonly<FallbackProps>) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', p: 3, minHeight: 320 }}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <Typography variant="h6">This page hit a problem</Typography>
        <Typography variant="body2" color="text.secondary">
          It has been reported to the tech team with what led up to it.
        </Typography>
        <Alert severity="error">{error.message}</Alert>
        <Button variant="contained" onClick={onRetry}>
          Try again
        </Button>
      </Stack>
    </Box>
  );
}

/**
 * Catches a render error, sends it to Tech > Logs with its component stack, and shows a
 * retry instead of a blank page. Key it by the path to clear it on navigation.
 */
export function PageErrorBoundary({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <LogErrorBoundary
      logger={portalLogger}
      fallback={(error, reset) => <PageCrashed error={error} onRetry={reset} />}
    >
      {children}
    </LogErrorBoundary>
  );
}
