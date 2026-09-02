import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { SupportConsolePage } from './pages/support';

/** Support micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.SUPPORT} homePath="/support">
      <Route path="/support" element={<SupportConsolePage />} />
    </PortalApp>
  );
}
