import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { ProtectedRoute } from '@exyconn/shell/routes/ProtectedRoute';
import { UserDetailsPage } from '@exyconn/shell/pages/UserDetails';
import { App } from '../../src/App';
import { AdminPage } from '../../src/pages/admin';
import { AnalyticsPage } from '../../src/pages/analytics';
import { AppSettingsPage } from '../../src/pages/app-settings';
import { AuditLogPage } from '../../src/pages/audit';
import { BrandingPage } from '../../src/pages/branding';
import { ClientsPage } from '../../src/pages/clients';
import { SystemHealthPage } from '../../src/pages/health';
import { OrganizationsPage } from '../../src/pages/organizations';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

const portal = vi.hoisted(() => ({ props: null as null | PortalProps }));

/** The real PortalApp builds an Apollo client and an AuthProvider; the stand-in records its props. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalProps>) => {
    portal.props = props;
    return null;
  },
}));

interface RouteProps {
  path: string;
  element: ReactElement<{ requiredRole?: string; children?: ReactElement }>;
}

function routes(): RouteProps[] {
  return Children.toArray(portal.props?.children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);
}

const elementAt = (path: string) => routes().find((route) => route.path === path)?.element;

describe('App', () => {
  it('mounts the shell for the ADMIN module, homed at /admin, signing in with Login', () => {
    render(<App />);
    expect(portal.props?.moduleRole).toBe(ROLES.ADMIN);
    expect(portal.props?.homePath).toBe('/admin');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('registers every admin route, the tab routes taking an optional slug', () => {
    render(<App />);
    expect(routes().map((route) => route.path)).toEqual([
      '/admin',
      '/admin/analytics',
      '/admin/users',
      '/admin/organizations',
      '/admin/branding/:tab?',
      '/admin/settings',
      '/admin/localization',
      '/admin/permissions/:tab?',
      '/admin/audit',
      '/admin/integrations/:tab?',
      '/admin/health',
      '/admin/users/:id',
      '/clients',
    ]);
  });

  it('puts each page on its route', () => {
    render(<App />);
    expect(elementAt('/admin/analytics')?.type).toBe(AnalyticsPage);
    expect(elementAt('/admin/users')?.type).toBe(AdminPage);
    expect(elementAt('/admin/branding/:tab?')?.type).toBe(BrandingPage);
    expect(elementAt('/admin/settings')?.type).toBe(AppSettingsPage);
    expect(elementAt('/admin/audit')?.type).toBe(AuditLogPage);
    expect(elementAt('/admin/health')?.type).toBe(SystemHealthPage);
    expect(elementAt('/admin/users/:id')?.type).toBe(UserDetailsPage);
    expect(elementAt('/clients')?.type).toBe(ClientsPage);
  });

  it('keeps the organizations console behind SUPER_ADMIN, not a company ADMIN', () => {
    render(<App />);
    const guard = elementAt('/admin/organizations');
    expect(guard?.type).toBe(ProtectedRoute);
    expect(guard?.props.requiredRole).toBe(ROLES.SUPER_ADMIN);
    expect(guard?.props.children?.type).toBe(OrganizationsPage);
  });
});
