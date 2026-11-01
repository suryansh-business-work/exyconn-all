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
import { McpSettingsPage } from '../../src/pages/settings';

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
    const servers = [
      McpEndpoint.Crm,
      McpEndpoint.Marketing,
      McpEndpoint.Admin,
      McpEndpoint.Ai,
      McpEndpoint.Clienthub,
      McpEndpoint.Compliance,
      McpEndpoint.Employee,
      McpEndpoint.Finance,
      McpEndpoint.Hr,
      McpEndpoint.It,
      McpEndpoint.Legal,
      McpEndpoint.Products,
      McpEndpoint.Projects,
      McpEndpoint.Social,
      McpEndpoint.Status,
      McpEndpoint.Support,
      McpEndpoint.Tech,
      McpEndpoint.Tracker,
      McpEndpoint.Website,
      McpEndpoint.Agents,
      McpEndpoint.All,
    ];
    expect(new Set(servers)).toEqual(new Set(Object.values(McpEndpoint)));
    expect(routes.map((route) => [route.path, route.element.type])).toEqual([
      ['/mcp', McpDashboardPage],
      ['/mcp/connect', McpConnectPage],
      ['/mcp/settings', McpSettingsPage],
      ...servers.map((endpoint) => [`/mcp/${endpoint.toLowerCase()}/:tab?`, McpServerPage]),
    ]);
    expect(routes.slice(3).map((route) => route.element.props)).toEqual(
      servers.map((endpoint) => ({ endpoint })),
    );
  });
});
