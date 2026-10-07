import { fireEvent, screen } from '@testing-library/react';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessagesScreen } from '../../../../src/components/messages/MessagesScreen';
import { useMessages, type MessagesQuery } from '../../../../src/hooks/useMessages';
import { renderWithProviders } from '../../test-utils';
import { message, queryByA11yLabel } from '../state';

vi.mock('../../../../src/hooks/useMessages', () => ({ useMessages: vi.fn() }));
vi.mock('../../../../src/forms/message', () => ({
  MessageForm: ({ onSend }: Readonly<{ onSend: (body: string) => Promise<void> }>) => (
    <button
      type="button"
      onClick={() => {
        onSend('Hello there').catch(() => undefined);
      }}
    >
      Send a message
    </button>
  ),
}));

const send = vi.fn((_body: string) => Promise.resolve());

function query(overrides: Partial<MessagesQuery> = {}): MessagesQuery {
  return { messages: [], loading: false, error: null, send, ...overrides };
}

beforeEach(() => {
  vi.mocked(useMessages).mockReturnValue(query());
});

function tab(name: string): HTMLElement {
  return screen.getByRole('tab', { name });
}

describe('MessagesScreen', () => {
  it('opens on the conversation, with the composer under it', () => {
    renderWithProviders(<MessagesScreen timezone="UTC" />);
    expect(
      screen.getByText('Between you and whoever administers tracking in your workspace.'),
    ).toBeInTheDocument();
    expect(useMessages).toHaveBeenLastCalledWith('CHAT');
    expect(tab('Chat')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Announcements')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send a message' })).toBeInTheDocument();
  });

  it('sends through the thread’s own send', () => {
    renderWithProviders(<MessagesScreen timezone="UTC" />);
    fireEvent.click(screen.getByRole('button', { name: 'Send a message' }));
    expect(send).toHaveBeenCalledWith('Hello there');
  });

  it('switches to the read-only announcements', () => {
    renderWithProviders(<MessagesScreen timezone="UTC" />);
    fireEvent.click(tab('Announcements'));
    expect(useMessages).toHaveBeenLastCalledWith('NOTICE');
    expect(tab('Announcements')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('No announcements')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Anything your workspace sends to every tracker appears here, and as a notification on this phone.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send a message' })).toBeNull();
  });

  it('shows the thread once it has loaded', () => {
    vi.mocked(useMessages).mockReturnValue(
      query({ messages: [message({ body: 'Please sync before you leave.' })] }),
    );
    renderWithProviders(<MessagesScreen timezone="UTC" />);
    expect(screen.getByText('Please sync before you leave.')).toBeInTheDocument();
    expect(screen.queryByText('No messages yet')).toBeNull();
  });

  it('holds the thread’s place while it loads', () => {
    vi.mocked(useMessages).mockReturnValue(query({ loading: true }));
    renderWithProviders(<MessagesScreen timezone="UTC" />);
    expect(queryByA11yLabel('Loading messages')).not.toBeNull();
  });

  it('says when the thread could not be read', () => {
    vi.mocked(useMessages).mockReturnValue(
      query({ error: 'Could not load your messages. Check your connection and try again.' }),
    );
    renderWithProviders(<MessagesScreen timezone="UTC" />);
    expect(
      screen.getByText('Could not load your messages. Check your connection and try again.'),
    ).toBeInTheDocument();
  });

  it('sits above the floating tab bar when there is one', () => {
    renderWithProviders(
      <BottomTabBarHeightContext.Provider value={84}>
        <MessagesScreen timezone="UTC" />
      </BottomTabBarHeightContext.Provider>,
    );
    expect(screen.getByRole('button', { name: 'Send a message' })).toBeInTheDocument();
    fireEvent.click(tab('Announcements'));
    expect(screen.queryByRole('button', { name: 'Send a message' })).toBeNull();
  });
});
