import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';

interface BodyGateProps {
  loading: boolean;
  error?: unknown;
  children: ReactNode;
}

/**
 * Holds a Legal form back until the document's text has arrived. The grids never carry the
 * text, so editing fetches it first — and a form opened before it lands would save an empty
 * body over the real one.
 */
export function BodyGate({ loading, error, children }: Readonly<BodyGateProps>) {
  const t = useT();
  if (loading) {
    return <LoadingState label="Loading the document" />;
  }
  if (error) {
    return (
      <Alert severity="error">
        {t('The document text could not be loaded. Close this and try again.')}
      </Alert>
    );
  }
  return <>{children}</>;
}
