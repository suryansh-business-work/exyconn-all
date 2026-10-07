import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { WebsiteChatFeedback, WebsiteChatSender } from '@exyconn/shell/graphql/generated';
import { BotMessageDetails } from '../../../../../src/pages/chat/conversation/BotMessageDetails';
import type { ChatMessage } from '../../../../../src/pages/chat/socket/chatSocket.types';
import { renderWithProviders } from '../../../test-utils';
import { chatMessage } from '../chat-fixtures';

const answer = (overrides: Partial<ChatMessage> = {}) =>
  chatMessage({ sender: WebsiteChatSender.Bot, senderName: 'Exy', ...overrides });

describe('BotMessageDetails', () => {
  it('links the web pages the answer came from, by title or address', () => {
    renderWithProviders(
      <BotMessageDetails
        message={answer({
          sources: [
            { title: 'Pricing', url: 'https://exyconn.com/pricing' },
            { title: '', url: 'https://exyconn.com/blog/agents' },
            { title: 'Unsafe', url: 'javascript:alert(1)' },
          ],
        })}
      />,
    );

    expect(screen.getByText('Sources')).toBeInTheDocument();
    const pricing = screen.getByRole('link', { name: 'Pricing' });
    expect(pricing).toHaveAttribute('href', 'https://exyconn.com/pricing');
    expect(pricing).toHaveAttribute('target', '_blank');
    expect(pricing).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      screen.getByRole('link', { name: 'https://exyconn.com/blog/agents' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Unsafe' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('shows no sources section when none is a web page', () => {
    renderWithProviders(
      <BotMessageDetails message={answer({ sources: [{ title: 'Notes', url: '/internal' }] })} />,
    );
    expect(screen.queryByText('Sources')).not.toBeInTheDocument();
  });

  it('lists the follow-up questions the visitor was offered', () => {
    renderWithProviders(
      <BotMessageDetails message={answer({ suggestions: ['How much?', 'How long?'] })} />,
    );

    expect(screen.getByText('Suggested to visitor')).toBeInTheDocument();
    expect(screen.getByText('How much?')).toBeInTheDocument();
    expect(screen.getByText('How long?')).toBeInTheDocument();
  });

  it('shows the visitor’s thumbs up or down', () => {
    const { unmount } = renderWithProviders(
      <BotMessageDetails message={answer({ feedback: WebsiteChatFeedback.Up })} />,
    );
    expect(
      screen.getByRole('img', { name: 'The visitor found this answer helpful' }),
    ).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <BotMessageDetails message={answer({ feedback: WebsiteChatFeedback.Down })} />,
    );
    expect(
      screen.getByRole('img', { name: 'The visitor found this answer unhelpful' }),
    ).toBeInTheDocument();
  });

  it('shows nothing extra for an unrated answer with no sources or follow-ups', () => {
    renderWithProviders(<BotMessageDetails message={answer()} />);

    expect(screen.queryByText('Sources')).not.toBeInTheDocument();
    expect(screen.queryByText('Suggested to visitor')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
