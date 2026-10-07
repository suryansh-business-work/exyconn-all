import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { ProductsOverviewPage, ProductsPage } from '../../src/pages/products';
import { SuppliersPage } from '../../src/pages/suppliers';
import { StockPage } from '../../src/pages/stock';
import { PurchaseOrdersPage } from '../../src/pages/purchase-orders';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

const portal = vi.hoisted(() => ({ props: null as unknown }));

/** The shell's PortalApp owns routing and auth; the stand-in records what products hands it. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalProps>) => {
    portal.props = props;
    return null;
  },
}));

vi.mock('@exyconn/login', () => ({ Login: () => null }));

/** Each route the app declares, as path -> the page component it renders. */
function declaredRoutes(children: ReactNode) {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((route) => {
      const { path, element } = route.props as { path: string; element: ReactElement };
      return [path, element.type] as const;
    });
}

describe('App', () => {
  it('mounts the products module behind the products role, with the shared sign-in', () => {
    render(<App />);
    const props = portal.props as PortalProps;

    expect(props.moduleRole).toBe(ROLES.PRODUCTS);
    expect(props.homePath).toBe('/products');
    expect(props.loginElement.type).toBe(Login);
  });

  it('routes every products screen to its page', () => {
    render(<App />);

    expect(declaredRoutes((portal.props as PortalProps).children)).toEqual([
      ['/products', ProductsOverviewPage],
      ['/products/catalogue', ProductsPage],
      ['/products/suppliers', SuppliersPage],
      ['/products/purchase-orders', PurchaseOrdersPage],
      ['/products/stock', StockPage],
    ]);
  });
});
