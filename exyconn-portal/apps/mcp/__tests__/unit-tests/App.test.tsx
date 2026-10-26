import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { McpEndpoint } from '@exyconn/shell/graphql/generated';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { McpDashboardPage } from '../../src/pages/dashboard';
import { McpConnectPage } from '../../src/pages/connect';
import { McpServerPage } from '../../src/pages/server';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

interface RouteProps {
  path: string;
  element: ReactElement;
}

const portal = vi.hoisted(() => ({ props: null as null | PortalProps }));

/** The real PortalApp builds an Apollo client and an AuthProvider; the stand-in records its props. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalProps>) => {
    portal.props = props;
    return null;
  },
}));

describe('App', () => {
  it('mounts the shell for everyone in the company, homed at /mcp, signing in with Login', () => {
    render(<App />);
    expect(portal.props?.moduleRole).toBe(ROLES.EMPLOYEE);
    expect(portal.props?.homePath).toBe('/mcp');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('puts the dashboard, the consent page and each server on their routes', () => {
    render(<App />);
    const routes = Children.toArray(portal.props?.children)
      .filter(isValidElement)
      .map((child) => child.props as RouteProps);
    expect(routes.map((route) => [route.path, route.element.type])).toEqual([
      ['/mcp', McpDashboardPage],
      ['/mcp/connect', McpConnectPage],
      ['/mcp/crm/:tab?', McpServerPage],
      ['/mcp/marketing/:tab?', McpServerPage],
      ['/mcp/all/:tab?', McpServerPage],
    ]);
    expect(routes.slice(2).map((route) => route.element.props)).toEqual([
      { endpoint: McpEndpoint.Crm },
      { endpoint: McpEndpoint.Marketing },
      { endpoint: McpEndpoint.All },
    ]);
  });
});
