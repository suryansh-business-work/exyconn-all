import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { App } from '../../src/App';
import { ClientLoginPage } from '../../src/auth/ClientLoginPage';
import { ClientGate } from '../../src/auth/ClientGate';
import { ClientHubLayout } from '../../src/layout/ClientHubLayout';
import { DashboardPage } from '../../src/pages/dashboard/DashboardPage';
import { InvoicesPage } from '../../src/pages/invoices/InvoicesPage';
import { TransactionsPage } from '../../src/pages/payments/TransactionsPage';
import { PaymentReturnPage } from '../../src/pages/payments/PaymentReturnPage';
import { SupportPage } from '../../src/pages/support/SupportPage';
import { ProjectsPage } from '../../src/pages/projects/ProjectsPage';
import { PATHS } from '../../src/paths';

interface PortalProps {
  loginElement: ReactElement;
  homePath: string;
  chrome: boolean;
  moduleRole?: string;
  publicRoutes: ReactElement<{
    element: ReactElement<{ children: ReactElement }>;
    children: ReactNode;
  }>;
  children: ReactNode;
}

interface RouteProps {
  path: string;
  element: ReactElement<{ children: ReactElement }>;
}

const portal = vi.hoisted(() => ({ props: null as null | PortalProps }));

/** The real PortalApp builds an Apollo client and an AuthProvider; the stand-in records its props. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalProps>) => {
    portal.props = props;
    return null;
  },
}));

function renderApp(): PortalProps {
  render(<App />);
  if (!portal.props) throw new Error('PortalApp was not rendered');
  return portal.props;
}

function hubRoutes(props: PortalProps): RouteProps[] {
  return Children.toArray(props.publicRoutes.props.children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);
}

describe('App', () => {
  it('mounts the shell without chrome or a module role, homed at the dashboard', () => {
    const props = renderApp();
    expect(props.homePath).toBe(PATHS.dashboard);
    expect(props.chrome).toBe(false);
    expect(props.moduleRole).toBeUndefined();
    expect(props.loginElement.type).toBe(ClientLoginPage);
    expect(props.children).toBeNull();
  });

  it('puts every hub screen behind the client gate and inside the hub layout', () => {
    const gate = renderApp().publicRoutes.props.element;
    expect(gate.type).toBe(ClientGate);
    expect(gate.props.children.type).toBe(ClientHubLayout);
  });

  it('registers each screen on its path, each behind its own error boundary', () => {
    const routes = hubRoutes(renderApp());
    expect(routes.map((route) => route.path)).toEqual([
      PATHS.dashboard,
      PATHS.invoices,
      PATHS.transactions,
      PATHS.paymentReturn,
      PATHS.support,
      PATHS.projects,
    ]);
    const pages = [
      DashboardPage,
      InvoicesPage,
      TransactionsPage,
      PaymentReturnPage,
      SupportPage,
      ProjectsPage,
    ];
    routes.forEach((route, index) => {
      expect(route.element.type).toBe(PageErrorBoundary);
      expect(route.element.props.children.type).toBe(pages[index]);
    });
  });
});
