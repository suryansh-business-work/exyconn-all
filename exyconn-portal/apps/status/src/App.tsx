import { ApolloProvider } from '@apollo/client/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { apolloClient } from '@exyconn/shell/config/apolloClient';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { NetworkActivityBar } from '@exyconn/shell/components/feedback/NetworkActivityBar';
import { StatusShell } from './components/StatusShell';
import { StatusPage } from './pages/status';
import { ReportPage } from './pages/report';
import { HelpPage } from './pages/help';
import { ConfirmSubscriptionPage, UnsubscribePage } from './pages/subscribe';
import { SharedProjectPage } from './pages/project';
import { SignContractPage } from './pages/sign';
import { PublicTicketPage } from './pages/ticket';
import { RateSupportPage } from './pages/rate';

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
          <NetworkActivityBar />
          <BrowserRouter>
            <StatusShell>
              <Routes>
                <Route path="/" element={<StatusPage />} />
                <Route path="/report" element={<ReportPage />} />
                {/* Support, for a customer with no account: the one app without a sign-in. */}
                <Route path="/help" element={<HelpPage />} />
                {/* The satisfaction survey a customer is emailed when their ticket is resolved. */}
                <Route path="/help/rate/:token" element={<RateSupportPage />} />
                <Route path="/subscribe/confirm" element={<ConfirmSubscriptionPage />} />
                <Route path="/unsubscribe" element={<UnsubscribePage />} />
                {/* A counterparty signing a contract from the link they were emailed. */}
                <Route path="/sign/:token" element={<SignContractPage />} />
                {/* A client's read-only view of one project, opened from a share link. */}
                <Route path="/project/:token" element={<SharedProjectPage />} />
                {/* One ticket somebody made public in Projects, opened from its public link. */}
                <Route path="/ticket/:token" element={<PublicTicketPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </StatusShell>
          </BrowserRouter>
        </NotificationProvider>
      </ColorModeProvider>
    </ApolloProvider>
  );
}
