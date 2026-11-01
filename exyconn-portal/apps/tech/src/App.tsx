import { Navigate, Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { MovedRedirect } from '@exyconn/shell/routes/MovedRedirect';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { TechOverviewPage } from './pages/overview';
import {
  EMAIL_ACCOUNTS_PATH,
  EnvironmentVariablesPage,
  SocialAppsPage,
  SOCIAL_APPS_PATH,
} from './pages/environment-variables';
import { EmailPage } from './pages/email';
import { SettingsPage } from './pages/settings';
import { ProblemReportsPage } from './pages/problem-reports';
import { StatusMonitorsPage } from './pages/status-monitors';
import { InfrastructurePage } from './pages/infrastructure';
import { IncidentsPage } from './pages/incidents';
import { LogsPage } from './pages/logs';
import { JobsPage } from './pages/jobs';
import { CloudflarePage } from './pages/security/cloudflare';
import { SonarPage, SslCertificatesPage } from './pages/security';
import { TechVaultGate } from './pages/environment-variables/vault/TechVaultGate';

/** Tech micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.TECH} homePath="/tech">
      <Route path="/tech" element={<TechOverviewPage />} />
      <Route path="/tech/environment-variables/:tab?" element={<EnvironmentVariablesPage />} />
      <Route
        path="/tech/social-apps"
        element={
          <TechVaultGate>
            <SocialAppsPage />
          </TechVaultGate>
        }
      />
      {/* It was an Environment Variables tab first; that address still lands on it. */}
      <Route
        path="/tech/environment-variables/social-apps"
        element={<Navigate to={SOCIAL_APPS_PATH} replace />}
      />
      {/* Gmail and Microsoft Mail were separate sections; both OAuth apps now share one. */}
      <Route
        path="/tech/environment-variables/gmail"
        element={<Navigate to={EMAIL_ACCOUNTS_PATH} replace />}
      />
      <Route
        path="/tech/environment-variables/microsoft-mail"
        element={<Navigate to={EMAIL_ACCOUNTS_PATH} replace />}
      />
      <Route path="/tech/email/:tab?" element={<EmailPage />} />
      <Route path="/tech/problem-reports" element={<ProblemReportsPage />} />
      <Route path="/tech/status-monitors" element={<StatusMonitorsPage />} />
      <Route path="/tech/infrastructure/:tab?" element={<InfrastructurePage />} />
      <Route path="/tech/incidents/:tab?" element={<IncidentsPage />} />
      <Route path="/tech/logs" element={<LogsPage />} />
      <Route path="/tech/jobs" element={<JobsPage />} />
      {/* Tech > Demos moved to the Agents console; old addresses land on the same screen there. */}
      <Route
        path="/tech/demos/calling-bot/*"
        element={
          <MovedRedirect app="agents" from="/tech/demos/calling-bot" to="/agents/calling-bot" />
        }
      />
      <Route
        path="/tech/demos/website-bot/*"
        element={
          <MovedRedirect app="agents" from="/tech/demos/website-bot" to="/agents/website-bot" />
        }
      />
      <Route
        path="/tech/demos/whatsapp-bot"
        element={
          <MovedRedirect
            app="agents"
            from="/tech/demos/whatsapp-bot"
            to="/agents/whatsapp/whatsapp-number"
          />
        }
      />
      <Route
        path="/tech/demos"
        element={<MovedRedirect app="agents" from="/tech/demos" to="/agents" />}
      />
      <Route path="/tech/settings" element={<SettingsPage />} />
      <Route path="/tech/security/cloudflare" element={<CloudflarePage />} />
      <Route path="/tech/security/ssl" element={<SslCertificatesPage />} />
      <Route path="/tech/security/sonar" element={<SonarPage />} />
    </PortalApp>
  );
}
