import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@/components/ui';
import { useAuth } from '@/auth/AuthContext';
import type { Role } from '@/auth/roles';
import { canAccess } from '@/auth/roles';
import { HUB_URL } from '@/config/apps';
import { ExternalRedirect } from './ExternalRedirect';

interface ProtectedRouteProps {
  children: ReactNode;
  /** When set, the user's role must be ADMIN or match this module role. */
  requiredRole?: Role;
}

/** Gates a route behind authentication and (optionally) a module role. */
export function ProtectedRoute({ children, requiredRole }: Readonly<ProtectedRouteProps>) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    // Carry the attempted URL through the login round-trip as a query param, so
    // it survives a full page reload (router state would not).
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (requiredRole && !canAccess(user.roles, requiredRole)) {
    // This app is a single module, so a missing role means there is nothing here
    // to fall back to — send the user to the hub's launcher instead.
    return <ExternalRedirect to={HUB_URL} />;
  }
  return <>{children}</>;
}
