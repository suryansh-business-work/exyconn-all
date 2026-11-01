import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WhatsappAgentPage } from '../../../../../src/pages/bots/whatsapp/WhatsappAgentPage';
import { WHATSAPP_AGENT_PATH, WHATSAPP_AGENT_TAB } from '../../../../../src/pages/bots';
import { renderWithProviders } from '../../../test-utils';

interface StudioConfigStub {
  channel: string;
  name: string;
  workflowsPath: string;
  renderPreview: (bundle: unknown, startWorkflow: string) => ReactNode;
  forbidden: ReactNode;
}

const studio = vi.hoisted(() => ({ config: null as StudioConfigStub | null }));

vi.mock('@exyconn/bot-studio/studio', () => ({
  StudioProvider: ({
    config,
    children,
  }: Readonly<{ config: StudioConfigStub; children: ReactNode }>) => {
    studio.config = config;
    return <>{children}</>;
  },
  WorkflowListPage: () => <p>Workflow list</p>,
  WorkflowEditorPage: () => <p>Workflow editor</p>,
  AnalyticsTab: () => <p>Analytics charts</p>,
  SessionsTab: () => <p>Session list</p>,
}));
vi.mock('@exyconn/bot-studio/widget', () => ({
  WidgetPreview: ({ startWorkflow }: Readonly<{ startWorkflow: string }>) => (
    <p>{`Widget playing ${startWorkflow}`}</p>
  ),
}));
vi.mock('../../../../../src/pages/bots/whatsapp/WhatsappNumberTab', () => ({
  WhatsappNumberTab: () => <p>Number settings</p>,
}));
vi.mock('../../../../../src/pages/bots/website-bot/DemosForbidden', () => ({
  DemosForbidden: () => <p>Not for you</p>,
}));

const renderAt = (slug: string) =>
  renderWithProviders(<WhatsappAgentPage />, {
    route: `${WHATSAPP_AGENT_PATH}/${slug}`,
    path: `${WHATSAPP_AGENT_PATH}/*`,
  });

describe('WhatsappAgentPage', () => {
  it('lives under /agents/whatsapp with one slug per tab', () => {
    expect(WHATSAPP_AGENT_PATH).toBe('/agents/whatsapp');
    expect(WHATSAPP_AGENT_TAB).toEqual({
      workflows: 'bot-workflows',
      analytics: 'analytics',
      sessions: 'sessions',
      number: 'whatsapp-number',
    });
  });

  it('lists the workflows under the first tab', () => {
    renderAt('bot-workflows');
    expect(screen.getByRole('heading', { name: 'WhatsApp agent' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Bot workflows',
      'Analytics',
      'Sessions',
      'WhatsApp number',
    ]);
    expect(screen.getByText('Workflow list')).toBeInTheDocument();
  });

  it('opens one workflow’s editor beneath the list', () => {
    renderAt('bot-workflows/wf-1');
    expect(screen.getByText('Workflow editor')).toBeInTheDocument();
    expect(screen.queryByText('Workflow list')).not.toBeInTheDocument();
  });

  it.each([
    ['analytics', 'Analytics charts'],
    ['sessions', 'Session list'],
    ['whatsapp-number', 'Number settings'],
  ])('shows the %s tab at its own address', (slug, text) => {
    renderAt(slug);
    expect(screen.getByRole('tabpanel')).toHaveTextContent(text);
  });

  it('runs the studio for the WhatsApp channel, previewing in the widget', () => {
    renderAt('analytics');
    expect(studio.config).toMatchObject({
      channel: 'whatsapp',
      name: 'WhatsApp agent',
      workflowsPath: '/agents/whatsapp/bot-workflows',
    });
    render(
      <>
        {studio.config?.renderPreview({}, 'welcome')}
        {studio.config?.forbidden}
      </>,
    );
    expect(screen.getByText('Widget playing welcome')).toBeInTheDocument();
    expect(screen.getByText('Not for you')).toBeInTheDocument();
  });
});
