import { Navigate, Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { Login } from '@exyconn/login';
import { Portal } from './pages/Portal/Portal';
import { LegacyModuleRedirect } from './routes/LegacyModuleRedirect';

/**
 * Hub micro-frontend (portal.exyconn.com): the module launcher plus the shared
 * profile/settings screens. Module routes live in their own apps now, so the
 * old `/portal/...` URLs are forwarded there instead of being served here.
 */
export function App() {
  return (
    <PortalApp loginElement={<Login />} homePath="/">
      <Route index element={<Portal />} />
      <Route path="/portal" element={<Portal />} />
      <Route path="/portal/profile" element={<Navigate to="/profile" replace />} />
      <Route path="/portal/settings" element={<Navigate to="/settings" replace />} />
      <Route path="/portal/*" element={<LegacyModuleRedirect />} />
    </PortalApp>
  );
}
