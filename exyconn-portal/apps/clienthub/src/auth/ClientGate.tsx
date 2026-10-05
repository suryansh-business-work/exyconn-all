import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useT } from '@exyconn/i18n';
import { Alert, Button } from '@exyconn/shell/components/ui';
import { CenteredState, LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { useClientHubMeQuery } from '@exyconn/shell/graphql/generated';
import { clientPass } from './clientPass';

const isSignedOut = (error: unknown) =>
  CombinedGraphQLErrors.is(error) &&
  error.errors.some((e) => e.extensions?.code === 'UNAUTHENTICATED');

/**
 * Opens the client hub only to a contact with a live pass; anyone else — or a pass the server
 * no longer honours (access switched off, expired) — goes to the email-and-code sign-in. A
 * network failure is not a sign-out: the contact is offered a retry and keeps their pass.
 */
export function ClientGate({ children }: Readonly<{ children: ReactNode }>) {
  const t = useT();
  const location = useLocation();
  const hasPass = clientPass.has();
  const { data, loading, error, refetch } = useClientHubMeQuery({ skip: !hasPass });
  const next = encodeURIComponent(location.pathname + location.search);

  if (hasPass && loading) {
    return <LoadingState />;
  }
  if (!hasPass || isSignedOut(error)) {
    if (hasPass) clientPass.clear();
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (!data?.clientHubMe) {
    return (
      <CenteredState fill>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              {t('Retry')}
            </Button>
          }
        >
          {t('The client hub could not be reached. Check your connection and try again.')}
        </Alert>
      </CenteredState>
    );
  }
  return children;
}
