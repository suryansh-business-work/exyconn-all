import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { FeedPage } from '../../src/pages/feed';
import { PostPage } from '../../src/pages/post';
import { ProfilePage } from '../../src/pages/profile';

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

const elementAt = (path: string) => routes().find((route) => route.path === path)?.element.type;

describe('App', () => {
  it('mounts the shell for every EMPLOYEE, homed at /social, signing in with Login', () => {
    render(<App />);
    expect(portal.props?.moduleRole).toBe(ROLES.EMPLOYEE);
    expect(portal.props?.homePath).toBe('/social');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('registers the feed, a post, your own profile and a colleague profile', () => {
    render(<App />);
    expect(routes().map((route) => route.path)).toEqual([
      '/social',
      '/social/posts/:id',
      '/social/me',
      '/social/people/:userId',
    ]);
  });

  it('puts each page on its route, with both profile routes sharing one page', () => {
    render(<App />);
    expect(elementAt('/social')).toBe(FeedPage);
    expect(elementAt('/social/posts/:id')).toBe(PostPage);
    expect(elementAt('/social/me')).toBe(ProfilePage);
    expect(elementAt('/social/people/:userId')).toBe(ProfilePage);
  });
});
