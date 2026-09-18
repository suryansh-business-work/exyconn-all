import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { AdminPage } from './pages/admin';
import { AdminOverviewPage } from './pages/overview';
import { AnalyticsPage } from './pages/analytics';
import { BrandingPage } from './pages/branding';
import { AppSettingsPage } from './pages/app-settings';
import { LocalizationPage } from './pages/localization';
import { ClientsPage } from './pages/clients';
import { OrganizationsPage } from './pages/organizations';
import { ProtectedRoute } from '@exyconn/shell/routes/ProtectedRoute';
import { UserDetailsPage } from '@exyconn/shell/pages/UserDetails';
import { PermissionsPage } from './pages/permissions';
import { AuditLogPage } from './pages/audit';
import { SystemHealthPage } from './pages/health';
import { IntegrationsPage } from './pages/integrations';

/** Admin micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.ADMIN} homePath="/admin">
      <Route path="/admin" element={<AdminOverviewPage />} />
      <Route path="/admin/analytics" element={<AnalyticsPage />} />
      <Route path="/admin/users" element={<AdminPage />} />
      {/* The platform's own console, inside the Admin portal: SUPER_ADMIN, never a company's ADMIN. */}
      <Route
        path="/admin/organizations"
        element={
          <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
            <OrganizationsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/branding/:tab?" element={<BrandingPage />} />
      <Route path="/admin/settings" element={<AppSettingsPage />} />
      <Route path="/admin/localization" element={<LocalizationPage />} />
      <Route path="/admin/permissions/:tab?" element={<PermissionsPage />} />
      <Route path="/admin/audit" element={<AuditLogPage />} />
      <Route path="/admin/integrations/:tab?" element={<IntegrationsPage />} />
      <Route path="/admin/health" element={<SystemHealthPage />} />
      <Route path="/admin/users/:id" element={<UserDetailsPage />} />
      <Route path="/clients" element={<ClientsPage />} />
    </PortalApp>
  );
}
