import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { ComplianceOverviewPage } from '../../src/pages/overview';
import { RisksPage } from '../../src/pages/risks';
import { ObjectivesPage } from '../../src/pages/objectives';
import { AuditsPage } from '../../src/pages/audits';
import { FindingsPage } from '../../src/pages/findings';
import { ReviewsPage } from '../../src/pages/reviews';

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
  it('mounts the shell for the COMPLIANCE module, homed at /compliance, signing in with Login', () => {
    render(<App />);
    expect(portal.props?.moduleRole).toBe(ROLES.COMPLIANCE);
    expect(portal.props?.homePath).toBe('/compliance');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('puts the overview at home and each register on its own route', () => {
    render(<App />);
    expect(routes().map((route) => [route.path, route.element.type])).toEqual([
      ['/compliance', ComplianceOverviewPage],
      ['/compliance/risks', RisksPage],
      ['/compliance/objectives', ObjectivesPage],
      ['/compliance/audits', AuditsPage],
      ['/compliance/findings', FindingsPage],
      ['/compliance/reviews', ReviewsPage],
    ]);
  });
});
