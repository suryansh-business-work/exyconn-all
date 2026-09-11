import type { ReactElement } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@exyconn/ui';

interface Props {
  error: Error;
  onRetry: () => void;
}

/**
 * What a crashed screen shows instead of a blank window. The error has already gone to
 * Tech > Logs by the time this renders (see LogErrorBoundary).
 */
export default function CrashFallback({ error, onRetry }: Readonly<Props>): ReactElement {
  return (
    <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 3 }}>
      <Stack spacing={2} sx={{ maxWidth: 440 }}>
        <Typography variant="h6">This screen hit a problem</Typography>
        <Typography variant="body2" color="text.secondary">
          It has been reported to the Exyconn tech team.
        </Typography>
        <Alert severity="error">{error.message}</Alert>
        <Button variant="contained" onClick={onRetry}>
          Try again
        </Button>
      </Stack>
    </Box>
  );
}
