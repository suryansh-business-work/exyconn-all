import type { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/ui/pickers';
import { apolloClient } from '@/config/apolloClient';
import { PortalI18nProvider } from '@/i18n/PortalI18nProvider';
import { DirectionSync } from '@/i18n/DirectionSync';
import { ColorModeProvider } from '@/theme/ColorModeContext';
import { AuthProvider } from '@/auth/AuthContext';
import type { Role } from '@/auth/roles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@/components/feedback/ConfirmProvider';
import { PortalLayout } from '@/layout/PortalLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { ProfilePage } from '@/pages/Profile';
import { SettingsPage } from '@/pages/Settings';
import { NotificationsPage } from '@/pages/Notifications';
import { ApprovalsPage } from '@/pages/Approvals';
import { RouteLogger } from '@/logging/RouteLogger';

/**
 * Where a password reset email sends people. Public, like /login, and served by the same
 * login element so every portal gets it without wiring a second screen.
 */
export const RESET_PASSWORD_PATH = '/reset-password';

/**
 * Where the unsubscribe link in a campaign email lands. Public for the same reason: the
 * person clicking it is a recipient, not a portal user, and making them sign in to leave
 * would defeat the point of the link.
 */
export const UNSUBSCRIBE_PATH = '/unsubscribe';

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
 * chrome around its module routes. Login, profile, settings and notifications live here, so
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
      {/* Outside the theme: the language decides the direction, and the direction decides
          the theme and which emotion cache its styles go through. */}
      <PortalI18nProvider>
        <DirectionSync />
        <ColorModeProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <NotificationProvider>
              <ConfirmProvider>
                <BrowserRouter>
                  <RouteLogger />
                  <AuthProvider>
                    <Routes>
                      <Route path="/login" element={loginElement} />
                      <Route path={RESET_PASSWORD_PATH} element={loginElement} />
                      <Route path={UNSUBSCRIBE_PATH} element={loginElement} />
                      <Route
                        element={
                          <ProtectedRoute requiredRole={moduleRole}>
                            <PortalLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/approvals" element={<ApprovalsPage />} />
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
      </PortalI18nProvider>
    </ApolloProvider>
  );
}
