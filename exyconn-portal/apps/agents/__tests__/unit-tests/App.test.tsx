import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Navigate } from 'react-router-dom';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { AgentsOverviewPage } from '../../src/pages/overview';
import { CallingBotPage, WebsiteBotPage, WhatsappAgentPage } from '../../src/pages/bots';
import {
  ChatConversationPage,
  ChatFaqsPage,
  ChatKnowledgePage,
  ChatLayout,
  ChatSessionsPage,
  ChatSettingsPage,
} from '../../src/pages/chat';
import { WhatsappLeadsPage } from '../../src/pages/whatsapp-leads';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

interface RouteProps {
  path?: string;
  element: ReactElement<{ to?: string; replace?: boolean }>;
  children?: ReactNode;
}

const portal = vi.hoisted(() => ({ props: null as null | PortalProps }));

/** The real PortalApp builds an Apollo client and an AuthProvider; the stand-in records its props. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalProps>) => {
    portal.props = props;
    return null;
  },
}));

const routesOf = (children: ReactNode) =>
  Children.toArray(children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);

describe('App', () => {
  it('mounts the shell for the Agents team, homed at /agents, signing in with Login', () => {
    render(<App />);
    expect(ROLES.AGENTS).toBe('AGENTS');
    expect(portal.props?.moduleRole).toBe(ROLES.AGENTS);
    expect(portal.props?.homePath).toBe('/agents');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('puts the overview, every agent and the leads on their routes', () => {
    render(<App />);
    const routes = routesOf(portal.props?.children);
    expect(routes.map((route) => [route.path, route.element.type])).toEqual([
      ['/agents', AgentsOverviewPage],
      ['/agents/whatsapp/*', WhatsappAgentPage],
      ['/agents/calling-bot/:tab?', CallingBotPage],
      ['/agents/website-bot/*', WebsiteBotPage],
      ['/agents/whatsapp-leads', WhatsappLeadsPage],
      [undefined, ChatLayout],
      ['/agents/chat', Navigate],
    ]);
    expect(routes[6].element.props).toEqual({ to: '/agents/chat/sessions', replace: true });
  });

  it('keeps every website chat screen under the one chat layout', () => {
    render(<App />);
    const layout = routesOf(portal.props?.children)[5];
    expect(routesOf(layout.children).map((route) => [route.path, route.element.type])).toEqual([
      ['/agents/chat/sessions', ChatSessionsPage],
      ['/agents/chat/sessions/:id/*', ChatConversationPage],
      ['/agents/chat/knowledge', ChatKnowledgePage],
      ['/agents/chat/faqs', ChatFaqsPage],
      ['/agents/chat/settings', ChatSettingsPage],
    ]);
  });
});
