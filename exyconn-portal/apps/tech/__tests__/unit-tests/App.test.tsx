import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Navigate } from 'react-router-dom';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { TechOverviewPage } from '../../src/pages/overview';
import {
  EnvironmentVariablesPage,
  SocialAppsPage,
  SOCIAL_APPS_PATH,
} from '../../src/pages/environment-variables';
import { EmailPage } from '../../src/pages/email';
import { TrackerBuildPage } from '../../src/pages/tracker-build';
import { SettingsPage } from '../../src/pages/settings';
import { ProblemReportsPage } from '../../src/pages/problem-reports';
import { StatusMonitorsPage } from '../../src/pages/status-monitors';
import { InfrastructurePage } from '../../src/pages/infrastructure';
import { IncidentsPage } from '../../src/pages/incidents';
import { LogsPage } from '../../src/pages/logs';
import { JobsPage } from '../../src/pages/jobs';
import { CloudflarePage } from '../../src/pages/security/cloudflare';
import { SonarPage, SslCertificatesPage } from '../../src/pages/security';

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
  element: ReactElement<{ to?: string; replace?: boolean }>;
}

function routes(): RouteProps[] {
  return Children.toArray(portal.props?.children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);
}

const elementAt = (path: string) => routes().find((route) => route.path === path)?.element;

describe('App', () => {
  it('mounts the shell for the TECH module, homed at /tech, signing in with Login', () => {
    render(<App />);
    expect(portal.props?.moduleRole).toBe(ROLES.TECH);
    expect(portal.props?.homePath).toBe('/tech');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('puts each Tech page on its route, tabbed pages taking an optional slug', () => {
    render(<App />);
    const pages: Array<[string, unknown]> = [
      ['/tech', TechOverviewPage],
      ['/tech/environment-variables/:tab?', EnvironmentVariablesPage],
      ['/tech/social-apps', SocialAppsPage],
      ['/tech/email/:tab?', EmailPage],
      ['/tech/tracker-build', TrackerBuildPage],
      ['/tech/problem-reports', ProblemReportsPage],
      ['/tech/status-monitors', StatusMonitorsPage],
      ['/tech/infrastructure/:tab?', InfrastructurePage],
      ['/tech/incidents/:tab?', IncidentsPage],
      ['/tech/logs', LogsPage],
      ['/tech/jobs', JobsPage],
      ['/tech/settings', SettingsPage],
      ['/tech/security/cloudflare', CloudflarePage],
      ['/tech/security/ssl', SslCertificatesPage],
      ['/tech/security/sonar', SonarPage],
    ];
    for (const [path, page] of pages) {
      expect(elementAt(path)?.type).toBe(page);
    }
    expect(routes()).toHaveLength(pages.length + 1);
  });

  it('sends the old Environment Variables social-apps tab to its own page', () => {
    render(<App />);
    const redirect = elementAt('/tech/environment-variables/social-apps');
    expect(redirect?.type).toBe(Navigate);
    expect(redirect?.props).toMatchObject({ to: SOCIAL_APPS_PATH, replace: true });
  });
});
