import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { AdminPage } from './pages/admin';
import { BrandingPage } from './pages/branding';
import { ClientsPage } from './pages/clients';
import { EnvironmentVariablesPage } from './pages/environment-variables';
import { UserDetailsPage } from '@exyconn/shell/pages/UserDetails';
import { PermissionsPage } from './pages/permissions';

/** Admin micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.ADMIN} homePath="/admin">
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/branding/:tab?" element={<BrandingPage />} />
      <Route path="/admin/permissions/:tab?" element={<PermissionsPage />} />
      <Route path="/admin/users/:id" element={<UserDetailsPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/environment-variables/:tab?" element={<EnvironmentVariablesPage />} />
    </PortalApp>
  );
}
