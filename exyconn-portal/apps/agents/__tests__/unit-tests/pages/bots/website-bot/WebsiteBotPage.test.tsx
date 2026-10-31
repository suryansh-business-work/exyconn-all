import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WebsiteBotPage } from '../../../../../src/pages/bots/website-bot/WebsiteBotPage';
import { WEBSITE_BOT_PATH } from '../../../../../src/pages/bots/website-bot';
import { renderWithProviders } from '../../../test-utils';

interface StudioConfigStub {
  channel: string;
  name: string;
  workflowsPath: string;
  renderPreview: (bundle: unknown, startWorkflow: string) => ReactNode;
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
vi.mock('../../../../../src/pages/bots/website-bot/WebsiteBotSetup', () => ({
  WebsiteBotSetup: () => <p>Setup guide</p>,
}));

const renderAt = (slug: string) =>
  renderWithProviders(<WebsiteBotPage />, {
    route: `${WEBSITE_BOT_PATH}/${slug}`,
    path: `${WEBSITE_BOT_PATH}/*`,
  });

describe('WebsiteBotPage', () => {
  it('lists the workflows under the first tab', () => {
    renderAt('bot-workflows');
    expect(screen.getByRole('heading', { name: 'Website chat bot' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Bot workflows',
      'Analytics',
      'Sessions',
      'Setup',
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
    ['setup', 'Setup guide'],
  ])('shows the %s tab at its own address', (slug, text) => {
    renderAt(slug);
    expect(screen.getByRole('tabpanel')).toHaveTextContent(text);
  });

  it('runs the studio for the website channel, previewing in the widget', () => {
    renderAt('setup');
    expect(studio.config).toMatchObject({
      channel: 'website',
      name: 'Website chat agent',
      workflowsPath: '/agents/website-bot/bot-workflows',
    });
    render(<>{studio.config?.renderPreview({}, 'welcome')}</>);
    expect(screen.getByText('Widget playing welcome')).toBeInTheDocument();
  });
});
