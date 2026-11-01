import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebsiteChatAttachmentKind, WebsiteChatSender } from '@exyconn/shell/graphql/generated';
import { MessageBubble } from '../../../../../src/pages/chat/conversation/MessageBubble';
import { renderWithProviders } from '../../../test-utils';
import { chatMessage } from '../chat-fixtures';

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatTime: (value: string) => value.slice(11, 16) }),
}));

const agentReply = chatMessage({
  sender: WebsiteChatSender.Agent,
  senderName: 'Ravi',
  body: 'On it',
});

describe('MessageBubble', () => {
  it('shows a system notice centred, with its time', () => {
    renderWithProviders(
      <MessageBubble
        message={chatMessage({ sender: WebsiteChatSender.System, body: 'Ravi joined' })}
        delivery="delivered"
        animate
      />,
    );
    expect(screen.getByRole('note')).toHaveTextContent('Ravi joined · 10:00');
  });

  it('shows who wrote a visitor message and when, with no delivery note', () => {
    renderWithProviders(
      <MessageBubble
        message={chatMessage({ body: 'Hi there' })}
        delivery="delivered"
        animate={false}
      />,
    );

    expect(screen.getByText('Asha · 10:00')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(screen.queryByText('Sent')).not.toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('adds the sources and suggestions under a bot answer', () => {
    renderWithProviders(
      <MessageBubble
        message={chatMessage({
          sender: WebsiteChatSender.Bot,
          senderName: 'Exy',
          suggestions: ['Book a call'],
        })}
        delivery="delivered"
        animate={false}
      />,
    );

    expect(screen.getByText('Exy · 10:00')).toBeInTheDocument();
    expect(screen.getByText('Suggested to visitor')).toBeInTheDocument();
    expect(screen.queryByText('Sent')).not.toBeInTheDocument();
  });

  it('says whether a delivered team reply was seen', () => {
    const { unmount } = renderWithProviders(
      <MessageBubble message={agentReply} delivery="delivered" animate={false} />,
    );
    expect(screen.getByText('Sent')).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <MessageBubble
        message={{ ...agentReply, readAt: '2026-10-01T10:01:00.000Z' }}
        delivery="delivered"
        animate={false}
      />,
    );
    expect(screen.getByText('Seen')).toBeInTheDocument();
  });

  it('shows a reply on its way', () => {
    renderWithProviders(<MessageBubble message={agentReply} delivery="sending" animate />);
    expect(screen.getByText('Sending…')).toBeInTheDocument();
  });

  it('marks a refused reply and lets the agent clear it', async () => {
    const onDismiss = vi.fn();
    renderWithProviders(
      <MessageBubble
        message={agentReply}
        delivery="failed"
        animate={false}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText('Not sent')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('offers no dismiss without a handler', () => {
    renderWithProviders(<MessageBubble message={agentReply} delivery="failed" animate={false} />);

    expect(screen.getByText('Not sent')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });

  it('shows only the attachment of a message with no text', () => {
    renderWithProviders(
      <MessageBubble
        message={chatMessage({
          body: '',
          attachments: [
            {
              url: 'https://cdn.exyconn.com/a.png',
              name: 'a.png',
              kind: WebsiteChatAttachmentKind.Image,
              size: 1,
            },
          ],
        })}
        delivery="delivered"
        animate={false}
      />,
    );

    expect(screen.getByRole('img', { name: 'a.png' })).toBeInTheDocument();
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });
});
