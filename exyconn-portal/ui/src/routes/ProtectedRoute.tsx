import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@/components/ui';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../auth/roles';
import { canAccess } from '../auth/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  /** When set, the user's role must be ADMIN or match this module role. */
  requiredRole?: Role;
}

/** Gates a route behind authentication and (optionally) a module role. */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && !canAccess(user.roles, requiredRole)) {
    return <Navigate to="/portal" replace />;
  }
  return <>{children}</>;
}
