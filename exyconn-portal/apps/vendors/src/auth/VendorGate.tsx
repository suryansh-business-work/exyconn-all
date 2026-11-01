import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useT } from '@exyconn/i18n';
import { Alert, Button } from '@exyconn/shell/components/ui';
import { CenteredState, LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { useVendorPortalMeQuery } from '@exyconn/shell/graphql/generated';
import { vendorPass } from './vendorPass';

const isSignedOut = (error: unknown) =>
  CombinedGraphQLErrors.is(error) &&
  error.errors.some((e) => e.extensions?.code === 'UNAUTHENTICATED');

/**
 * Opens the vendor portal only to a contact with a live pass; anyone else — or a pass the server
 * no longer honours (access switched off, expired) — goes to the email-and-code sign-in. A
 * network failure is not a sign-out: the contact is offered a retry and keeps their pass.
 */
export function VendorGate({ children }: Readonly<{ children: ReactNode }>) {
  const t = useT();
  const location = useLocation();
  const hasPass = vendorPass.has();
  const { data, loading, error, refetch } = useVendorPortalMeQuery({ skip: !hasPass });
  const next = encodeURIComponent(location.pathname + location.search);

  if (hasPass && loading) {
    return <LoadingState />;
  }
  if (!hasPass || isSignedOut(error)) {
    if (hasPass) vendorPass.clear();
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (!data?.vendorPortalMe) {
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
          {t('The vendor portal could not be reached. Check your connection and try again.')}
        </Alert>
      </CenteredState>
    );
  }
  return children;
}
