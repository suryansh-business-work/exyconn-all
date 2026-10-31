import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebsiteChatSender } from '@exyconn/shell/graphql/generated';
import { MessageThread } from '../../../../../src/pages/chat/conversation/MessageThread';
import { optimisticMessage } from '../../../../../src/pages/chat/conversation/conversation.messages';
import { renderWithProviders } from '../../../test-utils';
import { chatMessage } from '../chat-fixtures';

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatTime: (value: string) => value.slice(11, 16) }),
}));

const scrollIntoView = vi.fn();
const noFresh: ReadonlySet<string> = new Set();

const reply = (clientId: string, body: string, failed: boolean) => ({
  clientId,
  failed,
  message: optimisticMessage({ clientId, sessionId: 's1', senderName: 'Ravi', body, files: [] }),
});

function renderThread(overrides: Partial<Parameters<typeof MessageThread>[0]> = {}) {
  const onDismiss = vi.fn();
  const view = renderWithProviders(
    <MessageThread
      label="Chat with us"
      messages={[]}
      pending={[]}
      freshIds={noFresh}
      animate
      typingName={null}
      onDismiss={onDismiss}
      {...overrides}
    />,
  );
  return { ...view, onDismiss };
}

describe('MessageThread', () => {
  beforeEach(() => {
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('names the message log and says when the thread is empty', () => {
    renderThread();

    expect(screen.getByRole('log', { name: 'Chat with us' })).toBeInTheDocument();
    expect(screen.getByText('No messages in this thread yet.')).toBeInTheDocument();
  });

  it('lists the messages, then the replies still waiting, then who is typing', () => {
    renderThread({
      messages: [
        chatMessage({ id: 'a', body: 'Hi' }),
        chatMessage({
          id: 'b',
          sender: WebsiteChatSender.Agent,
          senderName: 'Ravi',
          body: 'Hello',
        }),
      ],
      pending: [reply('c1', 'One sec', false), reply('c2', 'Lost', true)],
      typingName: 'Asha',
    });

    expect(screen.queryByText('No messages in this thread yet.')).not.toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Sending…')).toBeInTheDocument();
    expect(screen.getByText('Not sent')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Asha is typing…');
  });

  it('clears a refused reply by its client id', async () => {
    const { onDismiss } = renderThread({ pending: [reply('c2', 'Lost', true)] });
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledWith('c2');
  });

  it('keeps the reply box under the thread when there is one', () => {
    renderThread({ composer: <textarea aria-label="Reply box" /> });
    expect(screen.getByRole('textbox', { name: 'Reply box' })).toBeInTheDocument();
  });

  it('scrolls the newest message into view, smoothly unless motion is reduced', () => {
    const { rerender } = renderThread();
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'end' });

    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
    rerender(
      <MessageThread
        label="Chat with us"
        messages={[chatMessage()]}
        pending={[]}
        freshIds={noFresh}
        animate={false}
        typingName={null}
        onDismiss={vi.fn()}
      />,
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'end' });
  });

  it('scrolls again when the visitor starts typing', () => {
    const { rerender } = renderThread();
    rerender(
      <MessageThread
        label="Chat with us"
        messages={[]}
        pending={[]}
        freshIds={noFresh}
        animate
        typingName="Asha"
        onDismiss={vi.fn()}
      />,
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });
});
