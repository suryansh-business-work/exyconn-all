import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { MarketingPage } from './pages/marketing';

/** Marketing micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.MARKETING} homePath="/marketing">
      <Route path="/marketing" element={<MarketingPage />} />
    </PortalApp>
  );
}
