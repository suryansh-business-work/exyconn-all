import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Navigate } from 'react-router-dom';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { ApiKeysPage } from '../../src/pages/api-keys/ApiKeysPage';
import { WebhooksPage } from '../../src/pages/webhooks/WebhooksPage';
import { DeliveriesPage } from '../../src/pages/deliveries/DeliveriesPage';
import { EventCataloguePage } from '../../src/pages/events/EventCataloguePage';
import { ApiReferencePage } from '../../src/pages/reference/ApiReferencePage';
import { McpPage } from '../../src/pages/mcp/McpPage';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

interface RouteProps {
  path: string;
  element: ReactElement<{ to?: string; replace?: boolean }>;
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

describe('App', () => {
  it('mounts the shell for administrators, homed at /developers, signing in with Login', () => {
    const props = renderApp();
    expect(props.moduleRole).toBe(ROLES.ADMIN);
    expect(props.homePath).toBe('/developers');
    expect(props.loginElement.type).toBe(Login);
  });

  it('sends the home path to API keys and puts each screen on its route', () => {
    const routes = Children.toArray(renderApp().children)
      .filter(isValidElement)
      .map((child) => child.props as RouteProps);
    expect(routes.map((route) => route.path)).toEqual([
      '/developers',
      '/developers/api-keys',
      '/developers/webhooks',
      '/developers/deliveries',
      '/developers/events',
      '/developers/reference',
      '/developers/mcp',
    ]);
    const [home, ...screens] = routes;
    expect(home.element.type).toBe(Navigate);
    expect(home.element.props).toMatchObject({ to: '/developers/api-keys', replace: true });
    expect(screens.map((route) => route.element.type)).toEqual([
      ApiKeysPage,
      WebhooksPage,
      DeliveriesPage,
      EventCataloguePage,
      ApiReferencePage,
      McpPage,
    ]);
  });
});
