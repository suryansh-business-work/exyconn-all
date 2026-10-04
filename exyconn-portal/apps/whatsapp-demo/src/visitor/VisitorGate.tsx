import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { canAccess, ROLES } from '@exyconn/shell/auth/roles';
import { HUB_URL } from '@exyconn/shell/config/apps';
import { ExternalRedirect } from '@exyconn/shell/routes/ExternalRedirect';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { useVisitor } from './useVisitor';

/**
 * Lets the chats open for an employee signed in to the portal or for a demo visitor signed in
 * with an emailed code; anyone else is sent to the demo's email-and-code sign-in. The server
 * enforces the same split on every chat operation.
 */
export function VisitorGate({ children }: Readonly<{ children: ReactNode }>) {
  const { user, loading: authLoading } = useAuth();
  const { visitor, loading } = useVisitor();
  const location = useLocation();

  if (authLoading || loading) {
    return <LoadingState />;
  }
  if (user) {
    return canAccess(user.roles, ROLES.EMPLOYEE) ? children : <ExternalRedirect to={HUB_URL} />;
  }
  if (visitor) {
    return children;
  }
  const next = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/login?next=${next}`} replace />;
}
