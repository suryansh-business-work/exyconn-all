import { useT } from '@exyconn/i18n';
import { Alert, Button } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';

interface LoadErrorProps {
  /** The server's own message, shown as it came. */
  message: string;
  /** Asks again — usually the query's `refetch`. A second failure lands back here. */
  onRetry: () => Promise<unknown>;
}

/** A query that failed: what the server said, and a way to ask again. */
export function LoadError({ message, onRetry }: Readonly<LoadErrorProps>) {
  const t = useT();
  const retry = () => {
    onRetry().catch((error: unknown) => portalLogger.warn('Meeting Assistant retry failed', error));
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
      {message}
    </Alert>
  );
}
