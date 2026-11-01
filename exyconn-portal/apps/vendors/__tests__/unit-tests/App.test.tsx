import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { App } from '../../src/App';
import { VendorLoginPage } from '../../src/auth/VendorLoginPage';
import { VendorGate } from '../../src/auth/VendorGate';
import { VendorLayout } from '../../src/layout/VendorLayout';
import { OrdersPage } from '../../src/pages/orders/OrdersPage';
import { InvoicesPage } from '../../src/pages/invoices/InvoicesPage';
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

function portalRoutes(props: PortalProps): RouteProps[] {
  return Children.toArray(props.publicRoutes.props.children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);
}

describe('App', () => {
  it('mounts the shell without chrome or a module role, homed at the orders', () => {
    const props = renderApp();
    expect(props.homePath).toBe(PATHS.orders);
    expect(props.chrome).toBe(false);
    expect(props.moduleRole).toBeUndefined();
    expect(props.loginElement.type).toBe(VendorLoginPage);
    expect(props.children).toBeNull();
  });

  it('puts every vendor screen behind the vendor gate and inside the vendor layout', () => {
    const gate = renderApp().publicRoutes.props.element;
    expect(gate.type).toBe(VendorGate);
    expect(gate.props.children.type).toBe(VendorLayout);
  });

  it('registers each screen on its literal path, each behind its own error boundary', () => {
    const routes = portalRoutes(renderApp());
    // Literal paths, so the nav coverage check sees them; they must agree with PATHS.
    expect(routes.map((route) => route.path)).toEqual(['/orders', '/invoices']);
    expect(routes.map((route) => route.path)).toEqual([PATHS.orders, PATHS.invoices]);
    const pages = [OrdersPage, InvoicesPage];
    routes.forEach((route, index) => {
      expect(route.element.type).toBe(PageErrorBoundary);
      expect(route.element.props.children.type).toBe(pages[index]);
    });
  });
});
