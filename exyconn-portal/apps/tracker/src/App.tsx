import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import {
  TrackerPage,
  TrackerAccessPage,
  TrackerDevicesPage,
  TrackerSettingsPage,
} from './pages/tracker';

/** Time Tracker micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.TRACKER} homePath="/tracker">
      <Route path="/tracker" element={<TrackerPage />} />
      <Route path="/tracker/access" element={<TrackerAccessPage />} />
      <Route path="/tracker/devices" element={<TrackerDevicesPage />} />
      <Route path="/tracker/settings" element={<TrackerSettingsPage />} />
    </PortalApp>
  );
}
