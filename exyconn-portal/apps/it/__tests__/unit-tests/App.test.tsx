import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { AccessManagementPage, PasswordResetsPage } from '../../src/pages/access';
import { AnnouncementsPage } from '../../src/pages/announcements';
import { AssetDetailPage, AssetsPage } from '../../src/pages/assets';
import { ChangesPage } from '../../src/pages/changes';
import { CloudPage } from '../../src/pages/cloud';
import { DashboardPage } from '../../src/pages/dashboard';
import { HelpdeskPage, HelpdeskTicketPage } from '../../src/pages/helpdesk';
import { IncidentsPage } from '../../src/pages/incidents';
import { CostPage, ReportsPage } from '../../src/pages/insights';
import { KnowledgeBasePage } from '../../src/pages/knowledge-base';
import { LicencesPage } from '../../src/pages/licences';
import { OffboardingPage, OnboardingPage } from '../../src/pages/lifecycle';
import { NetworkPage } from '../../src/pages/network';
import { PeoplePage } from '../../src/pages/people';
import { PoliciesPage } from '../../src/pages/policies';
import { ProcurementPage } from '../../src/pages/procurement';
import { SecurityPage } from '../../src/pages/security';
import { SettingsPage } from '../../src/pages/settings';

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
  element: ReactElement;
}

function routes(): RouteProps[] {
  return Children.toArray(portal.props?.children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);
}

describe('App', () => {
  it('mounts the shell for the IT module, homed at /it, signing in with Login', () => {
    render(<App />);
    expect(portal.props?.moduleRole).toBe(ROLES.IT);
    expect(portal.props?.homePath).toBe('/it');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('puts the dashboard at home and every IT screen on its own route', () => {
    render(<App />);
    expect(routes().map((route) => [route.path, route.element.type])).toEqual([
      ['/it', DashboardPage],
      ['/it/reports', ReportsPage],
      ['/it/helpdesk', HelpdeskPage],
      ['/it/helpdesk/:id', HelpdeskTicketPage],
      ['/it/knowledge-base', KnowledgeBasePage],
      ['/it/announcements', AnnouncementsPage],
      ['/it/people/:id?', PeoplePage],
      ['/it/access', AccessManagementPage],
      ['/it/passwords', PasswordResetsPage],
      ['/it/onboarding', OnboardingPage],
      ['/it/offboarding', OffboardingPage],
      ['/it/assets', AssetsPage],
      ['/it/assets/:id', AssetDetailPage],
      ['/it/licences', LicencesPage],
      ['/it/cloud', CloudPage],
      ['/it/network', NetworkPage],
      ['/it/incidents', IncidentsPage],
      ['/it/changes', ChangesPage],
      ['/it/security', SecurityPage],
      ['/it/procurement', ProcurementPage],
      ['/it/cost', CostPage],
      ['/it/policies', PoliciesPage],
      ['/it/settings', SettingsPage],
    ]);
  });
});
