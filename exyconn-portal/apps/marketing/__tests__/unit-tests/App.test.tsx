import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { MarketingOverviewPage, MarketingPage } from '../../src/pages/marketing';
import { AudiencesPage } from '../../src/pages/audiences';
import { SuppressionPage } from '../../src/pages/suppression';
import { SocialPage } from '../../src/pages/social';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

const portal = vi.hoisted(() => ({ props: null as unknown }));

/** The shell's PortalApp owns routing and auth; the stand-in records what marketing hands it. */
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
  it('mounts the marketing module behind the marketing role, with the shared sign-in', () => {
    render(<App />);
    const props = portal.props as PortalProps;

    expect(props.moduleRole).toBe(ROLES.MARKETING);
    expect(props.homePath).toBe('/marketing');
    expect(props.loginElement.type).toBe(Login);
  });

  it('routes every marketing screen to its page, with the social tab as a slug', () => {
    render(<App />);

    expect(declaredRoutes((portal.props as PortalProps).children)).toEqual([
      ['/marketing', MarketingOverviewPage],
      ['/marketing/campaigns', MarketingPage],
      ['/marketing/audiences', AudiencesPage],
      ['/marketing/suppression', SuppressionPage],
      ['/marketing/social/:tab?', SocialPage],
    ]);
  });
});
