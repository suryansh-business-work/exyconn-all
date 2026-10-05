import type { ReactNode } from 'react';
import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { ClientLoginPage } from './auth/ClientLoginPage';
import { ClientGate } from './auth/ClientGate';
import { ClientHubLayout } from './layout/ClientHubLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { TransactionsPage } from './pages/payments/TransactionsPage';
import { PaymentReturnPage } from './pages/payments/PaymentReturnPage';
import { SupportPage } from './pages/support/SupportPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { PATHS } from './paths';

/** One page behind its own boundary: a failing screen never takes the hub down. */
const page = (element: ReactNode) => <PageErrorBoundary>{element}</PageErrorBoundary>;

/**
 * The client hub (clienthub.exyconn.com): a client's people — given access in Admin › Clients —
 * sign in with their work email and a one-time code, then pay invoices online (Stripe or
 * Razorpay), download or email them, export transactions, raise support tickets and follow
 * their projects. Not a portal for employees: no portal session, role or sidebar is involved.
 */
export function App() {
  return (
    <PortalApp
      loginElement={<ClientLoginPage />}
      homePath={PATHS.dashboard}
      chrome={false}
      publicRoutes={
        <Route
          element={
            <ClientGate>
              <ClientHubLayout />
            </ClientGate>
          }
        >
          <Route path="/dashboard" element={page(<DashboardPage />)} />
          <Route path="/invoices" element={page(<InvoicesPage />)} />
          <Route path="/transactions" element={page(<TransactionsPage />)} />
          <Route path="/payments/return" element={page(<PaymentReturnPage />)} />
          <Route path="/support" element={page(<SupportPage />)} />
          <Route path="/projects" element={page(<ProjectsPage />)} />
        </Route>
      }
    >
      {null}
    </PortalApp>
  );
}
