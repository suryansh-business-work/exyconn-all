import { useT } from '@exyconn/i18n';
import { Alert, Button } from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useStudio } from '../StudioContext';
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
  const { forbidden } = useStudio();
  if (isForbidden(error)) {
    return forbidden;
  }
  const retry = () => {
    onRetry().catch((retryError: unknown) =>
      portalLogger.warn('Bot studio: retry failed', retryError, { title }),
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
