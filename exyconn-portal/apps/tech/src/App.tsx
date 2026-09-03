import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { EnvironmentVariablesPage } from './pages/environment-variables';
import { TrackerBuildPage } from './pages/tracker-build';
import { SettingsPage } from './pages/settings';
import { ProblemReportsPage } from './pages/problem-reports';
import { StatusMonitorsPage } from './pages/status-monitors';

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
      <Route path="/tech/problem-reports" element={<ProblemReportsPage />} />
      <Route path="/tech/status-monitors" element={<StatusMonitorsPage />} />
      <Route path="/tech/settings" element={<SettingsPage />} />
    </PortalApp>
  );
}
