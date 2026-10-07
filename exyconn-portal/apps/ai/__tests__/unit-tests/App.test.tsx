import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { AiOverviewPage, AiPage, PromptLibraryPage } from '../../src/pages/ai';

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

function routes(): RouteProps[] {
  return Children.toArray(portal.props?.children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);
}

describe('App', () => {
  it('mounts the shell for the AI module, homed at /ai, signing in with Login', () => {
    render(<App />);
    expect(portal.props?.moduleRole).toBe(ROLES.AI);
    expect(portal.props?.homePath).toBe('/ai');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('puts the overview, the jobs register and the prompt library on their routes', () => {
    render(<App />);
    expect(routes().map((route) => [route.path, route.element.type])).toEqual([
      ['/ai', AiOverviewPage],
      ['/ai/jobs', AiPage],
      ['/ai/prompts', PromptLibraryPage],
    ]);
  });
});
