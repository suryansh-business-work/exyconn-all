import type { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { apolloClient } from '@/config/apolloClient';
import { ColorModeProvider } from '@/theme/ColorModeContext';
import { AuthProvider } from '@/auth/AuthContext';
import type { Role } from '@/auth/roles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@/components/feedback/ConfirmProvider';
import { PortalLayout } from '@/layout/PortalLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { ProfilePage } from '@/pages/Profile';
import { SettingsPage } from '@/pages/Settings';

interface PortalAppProps {
  /** Login screen. Injected so the shell never has to depend on the login package. */
  loginElement: ReactNode;
  /** Role this app's module needs. Omitted by the hub, which is not a module. */
  moduleRole?: Role;
  /** This app's own module routes, as `<Route>` children of the portal layout. */
  children: ReactNode;
  /** Real route in this app that `/` and unknown paths fall back to. */
  homePath?: string;
}

/**
 * Composes every provider a portal micro-frontend needs and mounts the shared
 * chrome around its module routes. Login, profile and settings live here, so
 * each app gets them identically without owning any of that code.
 */
export function PortalApp({
  loginElement,
  moduleRole,
  children,
  homePath = '/',
}: Readonly<PortalAppProps>) {
  return (
    <ApolloProvider client={apolloClient}>
      <ColorModeProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <ConfirmProvider>
              <BrowserRouter>
                <AuthProvider>
                  <Routes>
                    <Route path="/login" element={loginElement} />
                    <Route
                      element={
                        <ProtectedRoute requiredRole={moduleRole}>
                          <PortalLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      {children}
                    </Route>
                    <Route path="*" element={<Navigate to={homePath} replace />} />
                  </Routes>
                </AuthProvider>
              </BrowserRouter>
            </ConfirmProvider>
          </NotificationProvider>
        </LocalizationProvider>
      </ColorModeProvider>
    </ApolloProvider>
  );
}
