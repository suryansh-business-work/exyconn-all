import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatListPane } from '../../../../../src/components/wa/list/ChatListPane';
import type { CatalogBundle } from '../../../../../src/runtime/types';
import { renderWithProviders } from '../../../test-utils';
import { bundle, chatRecord, message, store } from '../wa-ui.fixtures';

vi.mock('@exyconn/shell/auth/AuthContext', () => ({
  useAuth: () => ({ user: null, signOut: vi.fn() }),
}));

const BUNDLES = new Map<string, CatalogBundle>([
  ['clinic', bundle({ key: 'clinic', order: 1 })],
  ['salon', bundle({ key: 'salon', industry: 'Beauty', order: 2 }, { name: 'Glow Salon' })],
  ['bank', bundle({ key: 'bank', industry: 'Finance', order: 3 }, { name: 'Metro Bank' })],
  ['gym', bundle({ key: 'gym', industry: 'Fitness', order: 0 }, { name: 'Iron Gym' })],
]);

const STORE = store(
  {
    clinic: chatRecord('clinic', [message('c1', 100)], 2),
    salon: chatRecord('salon', [message('s1', 200), message('s2', 300)]),
  },
  { salon: true },
);

function renderPane(overrides: Partial<{ loading: boolean; failed: boolean }> = {}) {
  const props = { onRetry: vi.fn(), onOpen: vi.fn(), timeLabel: vi.fn((ms: number) => `t${ms}`) };
  renderWithProviders(
    <ChatListPane
      bundles={BUNDLES}
      store={STORE}
      activeKey="clinic"
      userName="Asha Nair"
      loading={overrides.loading ?? false}
      failed={overrides.failed ?? false}
      {...props}
    />,
  );
  return { ...props, user: userEvent.setup() };
}

/** The business names in the order the list shows them. */
function listedNames(): string[] {
  return screen
    .queryAllByRole('listitem')
    .map((item) => within(item).getByRole('button').getAttribute('aria-label') ?? '');
}

describe('ChatListPane', () => {
  it('lists the latest conversations first, then the rest in menu order', () => {
    const { timeLabel } = renderPane();
    expect(screen.getByRole('navigation', { name: 'Chat list' })).toBeInTheDocument();
    expect(listedNames()).toEqual([
      'Glow Salon, 0 unread',
      'City Clinic, 2 unread',
      'Iron Gym, 0 unread',
      'Metro Bank, 0 unread',
    ]);
    expect(timeLabel).toHaveBeenCalledWith(300);
    expect(timeLabel).toHaveBeenCalledWith(100);
    expect(screen.getByText('t300')).toBeInTheDocument();
  });

  it('shows who is typing and which chat is open', () => {
    renderPane();
    const salon = screen.getByRole('button', { name: 'Glow Salon, 0 unread' });
    expect(salon).toHaveTextContent('typing…');
    expect(screen.getByRole('button', { name: 'City Clinic, 2 unread' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('opens a chat', async () => {
    const { user, onOpen } = renderPane();
    await user.click(screen.getByRole('button', { name: 'Metro Bank, 0 unread' }));
    expect(onOpen).toHaveBeenCalledWith('bank');
  });

  it('searches business names and industries, ignoring case and spaces', async () => {
    const { user } = renderPane();
    const search = screen.getByRole('textbox', { name: 'Search chats' });
    await user.type(search, 'beauty');
    expect(listedNames()).toEqual(['Glow Salon, 0 unread']);
    await user.clear(search);
    await user.type(search, '  CLINIC ');
    expect(listedNames()).toEqual(['City Clinic, 2 unread']);
  });

  it('says when nothing matches the search', async () => {
    const { user } = renderPane();
    await user.type(screen.getByRole('textbox', { name: 'Search chats' }), 'zzz');
    expect(listedNames()).toEqual([]);
    expect(screen.getByText('No chats match your search')).toBeInTheDocument();
  });

  it('keeps only chats with unread messages under Unread', async () => {
    const { user } = renderPane();
    await user.click(screen.getByRole('button', { name: 'Unread' }));
    expect(listedNames()).toEqual(['City Clinic, 2 unread']);
    await user.type(screen.getByRole('textbox', { name: 'Search chats' }), 'salon');
    expect(screen.getByText('No unread chats')).toBeInTheDocument();
  });

  it('shows placeholder rows while the businesses load', () => {
    const { container } = renderWithProviders(
      <ChatListPane
        bundles={new Map()}
        store={store()}
        userName="Asha"
        loading
        failed={false}
        onRetry={vi.fn()}
        onOpen={vi.fn()}
        timeLabel={String}
      />,
    );
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('offers a retry when the businesses could not load', async () => {
    const { user, onRetry } = renderPane({ failed: true });
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the demo businesses.');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
