import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { ChatSessionsToolbar } from '../../../../../src/pages/chat/sessions/ChatSessionsToolbar';
import type { ChatArrival } from '../../../../../src/pages/chat/sessions/useLiveChatList';
import { EMPTY_CHAT_SESSION_FILTERS } from '../../../../../src/pages/chat/sessions/chat-sessions.filters';
import type { ChatConnection } from '../../../../../src/pages/chat/socket/chatSocket.types';
import { renderWithProviders } from '../../../test-utils';
import { ChatConsoleHarness, fakeChatConsole } from './chat-console';

vi.mock('@exyconn/shell/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/components/ui')>();
  const { DatePickerStub } = await import('./date-picker-stub');
  return { ...actual, DatePicker: DatePickerStub };
});

function renderToolbar(arrival: ChatArrival | null, connection: ChatConnection = 'ready') {
  const onFiltersChange = vi.fn();
  const chat = fakeChatConsole({}, connection);
  renderWithProviders(
    <ChatConsoleHarness value={chat.value}>
      <ChatSessionsToolbar
        filters={EMPTY_CHAT_SESSION_FILTERS}
        onFiltersChange={onFiltersChange}
        arrival={arrival}
      />
    </ChatConsoleHarness>,
  );
  return onFiltersChange;
}

describe('ChatSessionsToolbar', () => {
  it('shows the newest visitor message as a notice', () => {
    renderToolbar({ id: 'm1', name: 'Asha Rao' });
    expect(screen.getByText('New message from Asha Rao')).toBeInTheDocument();
  });

  it('shows no notice when nothing new has arrived', () => {
    renderToolbar(null);
    expect(screen.queryByText(/New message from/)).toBeNull();
  });

  it('shows whether the console is live next to the notification settings', () => {
    renderToolbar(null, 'offline');
    expect(screen.getByRole('status')).toHaveTextContent('Offline — reconnecting');
    expect(screen.getByRole('button', { name: 'Notification settings' })).toBeInTheDocument();
  });

  it('passes filter changes up', () => {
    const onFiltersChange = renderToolbar(null);
    fireEvent.click(screen.getByLabelText('Unread only'));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...EMPTY_CHAT_SESSION_FILTERS,
      unreadOnly: true,
    });
  });
});
