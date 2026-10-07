import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { ProjectsPage, ProjectWorkspacePage } from '../../src/pages/projects';
import { ProjectsOverviewPage } from '../../src/pages/overview';
import { BugsPage } from '../../src/pages/bugs';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

const portal = vi.hoisted(() => ({ props: null as unknown }));

/** The shell's PortalApp owns routing and auth; the stand-in records what Projects hands it. */
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
  it('mounts the Projects module behind the Projects role, with the shared sign-in', () => {
    render(<App />);
    const props = portal.props as PortalProps;

    expect(props.moduleRole).toBe(ROLES.PROJECTS);
    expect(props.homePath).toBe('/projects');
    expect(props.loginElement.type).toBe(Login);
  });

  it('routes the overview, the register, a workspace with its tab and page, and bugs', () => {
    render(<App />);

    expect(declaredRoutes((portal.props as PortalProps).children)).toEqual([
      ['/projects', ProjectsOverviewPage],
      ['/projects/list', ProjectsPage],
      ['/projects/:id/:tab?/:pageId?', ProjectWorkspacePage],
      ['/bugs', BugsPage],
    ]);
  });
});
