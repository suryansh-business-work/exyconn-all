import { Alert, Button, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import { PORTAL_URL } from '../config';

interface Props {
  error: Error;
  onRetry: () => void;
}

/** Where "Report an issue" leads: the employee portal's support page. */
const SUPPORT_URL = `${PORTAL_URL}/me/support`;

/**
 * What a crashed surface shows instead of nothing. The error has already gone to Tech > Logs
 * (LogErrorBoundary) by the time this renders.
 */
export function CrashFallback({ error, onRetry }: Readonly<Props>) {
  const t = useT();
  return (
    <Stack spacing={1.5} sx={{ p: 2 }} role="alert">
      <Typography variant="subtitle1" component="h2">
        {t('The meeting assistant hit a problem')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('It has been reported to the Exyconn tech team.')}
      </Typography>
      <Alert severity="error">{error.message}</Alert>
      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={onRetry}>
          {t('Retry')}
        </Button>
        <Button variant="outlined" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
          {t('Report an issue')}
        </Button>
      </Stack>
    </Stack>
  );
}
