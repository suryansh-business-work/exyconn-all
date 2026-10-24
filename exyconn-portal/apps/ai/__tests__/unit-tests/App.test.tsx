import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { ProtectedRoute } from '@exyconn/shell/routes/ProtectedRoute';
import { App } from '../../src/App';
import { AiOverviewPage, AiPage, PromptLibraryPage } from '../../src/pages/ai';
import { McpConnectPage, McpServersPage } from '../../src/pages/mcp';
import * as meetings from '@exyconn/meetings-ui';

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
    expect(
      routes()
        .slice(0, 5)
        .map((route) => [route.path, route.element.type]),
    ).toEqual([
      ['/ai', AiOverviewPage],
      ['/ai/jobs', AiPage],
      ['/ai/prompts', PromptLibraryPage],
      ['/ai/mcp/connect', McpConnectPage],
      ['/ai/mcp/:tab?', McpServersPage],
    ]);
  });

  it('mounts the Meeting Assistant for the whole company under /ai/meeting-assistant', () => {
    render(<App />);
    const company = { scope: 'ALL', basePath: '/ai/meeting-assistant' };
    expect(
      routes()
        .slice(5)
        .map((route) => [route.path, route.element.type, route.element.props]),
    ).toEqual([
      ['/ai/meeting-assistant', meetings.MeetingDashboardPage, company],
      ['/ai/meeting-assistant/meetings', meetings.MeetingsListPage, company],
      ['/ai/meeting-assistant/calendar', meetings.MeetingCalendarPage, company],
      ['/ai/meeting-assistant/meetings/:id/:tab?', meetings.MeetingDetailPage, company],
      ['/ai/meeting-assistant/transcripts', meetings.TranscriptsPage, company],
      ['/ai/meeting-assistant/notes', meetings.MeetingsListPage, { ...company, notesOnly: true }],
      ['/ai/meeting-assistant/actions', meetings.ActionChecklistPage, company],
      ['/ai/meeting-assistant/participants', meetings.ParticipantsPage, company],
      ['/ai/meeting-assistant/extension', meetings.ExtensionPage, {}],
      ['/ai/meeting-assistant/settings', meetings.MeetingSettingsPage, {}],
      ['/ai/meeting-assistant/logs', meetings.LogsPage, company],
      ['/ai/meeting-assistant/releases', ProtectedRoute, expect.anything()],
      ['/ai/meeting-assistant/releases/:id', ProtectedRoute, expect.anything()],
    ]);
  });

  it.each([
    ['/ai/meeting-assistant/releases', meetings.ReleasesPage],
    ['/ai/meeting-assistant/releases/:id', meetings.ReleaseDetailsPage],
  ])('keeps %s to administrators', (path, page) => {
    render(<App />);
    const releases = routes().find((route) => route.path === path);
    const guard = releases?.element as ReactElement<{
      requiredRole: string;
      children: ReactElement;
    }>;
    expect(guard.props.requiredRole).toBe(ROLES.ADMIN);
    expect(guard.props.children.type).toBe(page);
  });
});
