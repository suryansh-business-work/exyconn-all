import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { WebsiteChatChannel, WebsiteChatSender } from '@exyconn/shell/graphql/generated';
import { ChatAlerts } from '../../../../../src/pages/chat/alerts/ChatAlerts';
import { playChime } from '../../../../../src/pages/chat/alerts/chime';
import { notifyDesktop } from '../../../../../src/pages/chat/alerts/desktopNotification';
import { useCurrentUrl } from '../../../test-utils';
import { chatMessage } from '../chat-fixtures';
import { fakeConsole, renderWithConsole, type FakeConsole } from '../chat-console';

vi.mock('../../../../../src/pages/chat/alerts/chime', () => ({ playChime: vi.fn() }));
vi.mock('../../../../../src/pages/chat/alerts/desktopNotification', () => ({
  notifyDesktop: vi.fn(),
}));

function UrlProbe() {
  return <output aria-label="current url">{useCurrentUrl()}</output>;
}

function renderAlerts(chat: FakeConsole) {
  renderWithConsole(
    <>
      <ChatAlerts />
      <UrlProbe />
    </>,
    () => chat,
    { route: '/website/chat/faqs' },
  );
}

const withPrefs = (sound: boolean, desktop: boolean) =>
  fakeConsole({ prefs: { sound, desktop, animate: true } });

describe('ChatAlerts', () => {
  beforeEach(() => {
    vi.mocked(playChime).mockClear();
    vi.mocked(notifyDesktop).mockClear();
  });

  it('rings for a visitor writing in the live thread when sound is on', () => {
    const chat = withPrefs(true, false);
    renderAlerts(chat);
    chat.emit({ t: 'message', message: chatMessage() });

    expect(playChime).toHaveBeenCalledTimes(1);
    expect(notifyDesktop).not.toHaveBeenCalled();
  });

  it('stays silent when sound is off', () => {
    const chat = withPrefs(false, false);
    renderAlerts(chat);
    chat.emit({ t: 'message', message: chatMessage() });

    expect(playChime).not.toHaveBeenCalled();
  });

  it('notifies the desktop with the sender and the message, opening the chat on click', () => {
    const chat = withPrefs(false, true);
    renderAlerts(chat);
    chat.emit({ t: 'message', message: chatMessage({ sessionId: 's9', body: 'Pricing?' }) });

    expect(notifyDesktop).toHaveBeenCalledWith(
      'New chat message from Asha',
      'Pricing?',
      's9',
      expect.any(Function),
    );
    const open = vi.mocked(notifyDesktop).mock.calls[0][3];
    act(() => open());
    expect(screen.getByLabelText('current url')).toHaveTextContent('/website/chat/sessions/s9');
  });

  it('says an attachment was sent when the message has no text', () => {
    const chat = withPrefs(false, true);
    renderAlerts(chat);
    chat.emit({ t: 'message', message: chatMessage({ body: '' }) });

    expect(vi.mocked(notifyDesktop).mock.calls[0][1]).toBe('Sent an attachment');
  });

  it('ignores other frames, team and bot messages and questions to the knowledge bot', () => {
    const chat = withPrefs(true, true);
    renderAlerts(chat);
    chat.emit({ t: 'ready' });
    chat.emit({ t: 'messageUpdated', message: chatMessage() });
    chat.emit({ t: 'message', message: chatMessage({ sender: WebsiteChatSender.Agent }) });
    chat.emit({ t: 'message', message: chatMessage({ sender: WebsiteChatSender.Bot }) });
    chat.emit({ t: 'message', message: chatMessage({ channel: WebsiteChatChannel.Knowledge }) });

    expect(playChime).not.toHaveBeenCalled();
    expect(notifyDesktop).not.toHaveBeenCalled();
  });
});
