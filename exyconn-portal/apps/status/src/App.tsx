import { ApolloProvider } from '@apollo/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { apolloClient } from '@exyconn/shell/config/apolloClient';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { StatusShell } from './components/StatusShell';
import { StatusPage } from './pages/status';
import { ReportPage } from './pages/report';

/**
 * Public status site. Unlike every other micro-frontend it deliberately does not use
 * `PortalApp`: there is no sign-in, no role and no portal chrome here — an outage is
 * exactly when nobody can log in, so the page has to work without an account.
 */
export function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ColorModeProvider>
        <NotificationProvider>
          <BrowserRouter>
            <StatusShell>
              <Routes>
                <Route path="/" element={<StatusPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </StatusShell>
          </BrowserRouter>
        </NotificationProvider>
      </ColorModeProvider>
    </ApolloProvider>
  );
}
