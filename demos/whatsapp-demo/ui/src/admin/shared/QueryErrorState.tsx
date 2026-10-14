import { useT } from '@exyconn/i18n';
import { Alert, Button } from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { AdminForbidden } from '../shell/AdminForbidden';
import { isForbidden } from './isForbidden';

interface QueryErrorStateProps {
  error: unknown;
  /** English source, translated here: what could not be loaded. */
  title: string;
  /** Re-runs the failed query. */
  onRetry: () => Promise<unknown>;
}

/**
 * What an admin panel shows when its query failed: the refusal screen for FORBIDDEN, otherwise
 * the reason and a Retry. The failure itself is already reported by the Apollo link.
 */
export function QueryErrorState({ error, title, onRetry }: Readonly<QueryErrorStateProps>) {
  const t = useT();
  if (isForbidden(error)) {
    return <AdminForbidden />;
  }
  const retry = () => {
    onRetry().catch((retryError: unknown) =>
      portalLogger.warn('WhatsApp demo admin: retry failed', retryError, { title }),
    );
  };
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={retry}>
          {t('Retry')}
        </Button>
      }
    >
      {t(title)} {errorMessage(error, t('The server did not answer.'))}
    </Alert>
  );
}
