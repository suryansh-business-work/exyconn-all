import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebsiteChatSettingsDocument } from '@exyconn/shell/graphql/generated';
import { KnowledgeSyncPanel } from '../../../../../src/pages/chat/knowledge/KnowledgeSyncPanel';
import { renderWithProviders } from '../../../test-utils';
import { settingsRow } from '../chat-fixtures';

const gql = vi.hoisted(() => ({
  settings: undefined as unknown,
  sync: vi.fn(),
  syncing: false,
  syncOptions: null as unknown,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useWebsiteChatSettingsQuery: () => ({ data: gql.settings }),
  useSyncWebsiteChatKnowledgeMutation: (options: unknown) => {
    gql.syncOptions = options;
    return [gql.sync, { loading: gql.syncing }];
  },
}));
vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `on ${value.slice(0, 10)}` }),
}));

function renderPanel(settings: Partial<ReturnType<typeof settingsRow>> | null = {}) {
  gql.settings = settings ? { websiteChatSettings: settingsRow(settings) } : undefined;
  const onSynced = vi.fn();
  renderWithProviders(<KnowledgeSyncPanel onSynced={onSynced} />);
  return onSynced;
}

const syncButton = () => screen.getByRole('button', { name: 'Sync website content' });

describe('KnowledgeSyncPanel', () => {
  beforeEach(() => {
    gql.sync.mockReset().mockResolvedValue({ data: { syncWebsiteChatKnowledge: { count: 42 } } });
    gql.syncing = false;
  });

  it('explains the two kinds of entry and says when nothing was synced yet', () => {
    renderPanel();

    expect(screen.getByText(/Website entries are read from exyconn.com/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Not synced yet');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('treats settings that have not loaded as never synced', () => {
    renderPanel(null);
    expect(screen.getByRole('status')).toHaveTextContent('Not synced yet');
  });

  it('says when the last sync ran and how many pages it read', () => {
    renderPanel({ knowledgeSyncedAt: '2026-10-05T08:00:00.000Z', knowledgeSyncCount: 37 });
    expect(screen.getByRole('status')).toHaveTextContent('Last synced on 2026-10-05 · 37 pages');
  });

  it('shows why the last sync failed', () => {
    renderPanel({ knowledgeSyncError: 'exyconn.com timed out' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The last sync failed: exyconn.com timed out',
    );
  });

  it('syncs, reports the pages read, refreshes the settings and reloads the list', async () => {
    const onSynced = renderPanel();
    await userEvent.click(syncButton());

    expect(await screen.findByText('Read 42 pages from the website')).toBeInTheDocument();
    expect(onSynced).toHaveBeenCalledTimes(1);
    expect(gql.syncOptions).toEqual({ refetchQueries: [WebsiteChatSettingsDocument] });
  });

  it('counts zero pages when the sync returns no data', async () => {
    gql.sync.mockResolvedValue({ data: undefined });
    renderPanel();
    await userEvent.click(syncButton());

    expect(await screen.findByText('Read 0 pages from the website')).toBeInTheDocument();
  });

  it('says why the sync failed and keeps the list as it is', async () => {
    gql.sync.mockRejectedValue(new Error('OpenAI quota exceeded'));
    const onSynced = renderPanel();
    await userEvent.click(syncButton());

    expect(await screen.findByText('OpenAI quota exceeded')).toBeInTheDocument();
    expect(onSynced).not.toHaveBeenCalled();
  });

  it('shows the sync running and blocks a second one', () => {
    gql.syncing = true;
    renderPanel();

    const running = screen.getByRole('button', { name: 'Syncing…' });
    expect(running).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
