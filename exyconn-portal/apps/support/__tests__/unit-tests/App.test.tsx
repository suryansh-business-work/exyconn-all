import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { TicketDetailPage } from '@exyconn/shell/pages/ticket-desk';
import { App } from '../../src/App';
import { SlaPoliciesPage, SupportConsolePage, SupportOverviewPage } from '../../src/pages/support';
import { KnowledgeBasePage } from '../../src/pages/knowledge-base';
import { CannedRepliesPage } from '../../src/pages/canned-replies';

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
  element: ReactElement<Record<string, unknown>>;
}

function routes(): RouteProps[] {
  return Children.toArray(portal.props?.children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);
}

describe('App', () => {
  it('mounts the shell for the SUPPORT module, homed at /support, signing in with Login', () => {
    render(<App />);
    expect(portal.props?.moduleRole).toBe(ROLES.SUPPORT);
    expect(portal.props?.homePath).toBe('/support');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('puts each Support page on its own route', () => {
    render(<App />);
    expect(routes().map((route) => [route.path, route.element.type])).toEqual([
      ['/support', SupportOverviewPage],
      ['/support/tickets', SupportConsolePage],
      ['/support/tickets/:id', TicketDetailPage],
      ['/support/sla', SlaPoliciesPage],
      ['/support/knowledge-base', KnowledgeBasePage],
      ['/support/canned-replies', CannedRepliesPage],
    ]);
  });

  it('sends the ticket page back to the console', () => {
    render(<App />);
    const ticketRoute = routes().find((route) => route.path === '/support/tickets/:id');
    expect(ticketRoute?.element.props).toEqual({ backPath: '/support/tickets' });
  });
});
