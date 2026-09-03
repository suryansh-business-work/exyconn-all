import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { EnvironmentVariablesPage } from './pages/environment-variables';
import { TrackerBuildPage } from './pages/tracker-build';
import { SettingsPage } from './pages/settings';

/** Tech micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp
      loginElement={<Login />}
      moduleRole={ROLES.TECH}
      homePath="/tech/environment-variables"
    >
      <Route path="/tech/environment-variables/:tab?" element={<EnvironmentVariablesPage />} />
      <Route path="/tech/tracker-build" element={<TrackerBuildPage />} />
      <Route path="/tech/settings" element={<SettingsPage />} />
    </PortalApp>
  );
}
