import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { AdminPage } from './pages/admin';
import { BrandingPage } from './pages/branding';
import { ClientsPage } from './pages/clients';
import { TechPage } from './pages/tech';
import { UserDetailsPage } from '@exyconn/shell/pages/UserDetails';

/** Admin micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.ADMIN} homePath="/admin">
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/branding" element={<BrandingPage />} />
      <Route path="/admin/users/:id" element={<UserDetailsPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/tech" element={<TechPage />} />
    </PortalApp>
  );
}
