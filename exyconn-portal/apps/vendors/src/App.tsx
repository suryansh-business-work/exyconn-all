import type { ReactNode } from 'react';
import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { VendorLoginPage } from './auth/VendorLoginPage';
import { VendorGate } from './auth/VendorGate';
import { VendorLayout } from './layout/VendorLayout';
import { OrdersPage } from './pages/orders/OrdersPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { PATHS } from './paths';

/** One page behind its own boundary: a failing screen never takes the portal down. */
const page = (element: ReactNode) => <PageErrorBoundary>{element}</PageErrorBoundary>;

/**
 * The vendor portal (vendors.exyconn.com): a supplier's people — given access in Products ›
 * Suppliers — sign in with their work email and a one-time code, then see their purchase
 * orders, acknowledge them, send invoices against them and follow payment. Not a portal for
 * employees: no portal session, role or sidebar is involved.
 */
export function App() {
  return (
    <PortalApp
      loginElement={<VendorLoginPage />}
      homePath={PATHS.orders}
      chrome={false}
      publicRoutes={
        <Route
          element={
            <VendorGate>
              <VendorLayout />
            </VendorGate>
          }
        >
          <Route path={PATHS.orders} element={page(<OrdersPage />)} />
          <Route path={PATHS.invoices} element={page(<InvoicesPage />)} />
        </Route>
      }
    >
      {null}
    </PortalApp>
  );
}
