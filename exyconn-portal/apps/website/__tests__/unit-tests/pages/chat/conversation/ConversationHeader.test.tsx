import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { WebsiteChatSite, WebsiteChatStatus } from '@exyconn/shell/graphql/generated';
import { ConversationHeader } from '../../../../../src/pages/chat/conversation/ConversationHeader';
import type { ChatSession } from '../../../../../src/pages/chat/socket/chatSocket.types';
import { renderWithProviders } from '../../../test-utils';
import { chatSession } from '../chat-fixtures';

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `at ${value.slice(11, 16)}` }),
}));
vi.mock('../../../../../src/pages/chat/alerts/ChatConsoleStatus', () => ({
  ChatConsoleStatus: () => <output>Console status</output>,
}));
vi.mock('../../../../../src/pages/chat/conversation/ClosesCountdown', () => ({
  ClosesCountdown: ({ expiresAt }: Readonly<{ expiresAt: string }>) => (
    <output>{`Closes at ${expiresAt}`}</output>
  ),
}));

function renderHeader(session: ChatSession) {
  renderWithProviders(
    <ConversationHeader
      session={session}
      isMine={false}
      isClosed={session.status === WebsiteChatStatus.Closed}
      claiming={false}
      onClaim={vi.fn()}
      onClose={vi.fn()}
      onDownload={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
}

/** The value shown under a detail's label. */
const detail = (label: string) => screen.getByText(label).nextElementSibling;

describe('ConversationHeader', () => {
  it('names the visitor and shows where they wrote from and how to reach them', () => {
    renderHeader(chatSession({ expiresAt: '2026-10-01T10:30:00.000Z' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'asha@example.com' })).toHaveAttribute(
      'href',
      'mailto:asha@example.com',
    );
    expect(detail('Phone')).toHaveTextContent('+91 98765 43210');
    expect(detail('Site')).toHaveTextContent('exyconn.com');
    const page = screen.getByRole('link', { name: 'https://exyconn.com/pricing' });
    expect(page).toHaveAttribute('target', '_blank');
    expect(detail('Ticket')).toHaveTextContent('TCK-12');
    expect(detail('Assignee')).toHaveTextContent('Unassigned');
    expect(screen.getByText('Closes at 2026-10-01T10:30:00.000Z')).toBeInTheDocument();
    expect(screen.queryByText('Slack thread')).not.toBeInTheDocument();
  });

  it('leads back to the chat list next to the console status', () => {
    renderHeader(chatSession());

    expect(screen.getByRole('link', { name: 'Back to chat sessions' })).toHaveAttribute(
      'href',
      '/website/chat/sessions',
    );
    expect(screen.getByText('Console status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Claim' })).toBeInTheDocument();
  });

  it('says who has the chat and since when', () => {
    renderHeader(chatSession({ assigneeName: 'Ravi', assignedAt: '2026-10-01T10:05:00.000Z' }));
    expect(detail('Assignee')).toHaveTextContent('Ravi · since at 10:05');
  });

  it('names the assignee alone when the time they took it is unknown', () => {
    renderHeader(chatSession({ assigneeName: 'Ravi' }));
    expect(detail('Assignee')).toHaveTextContent(/^Ravi$/);
  });

  it('shows dashes for missing details and the page as text when it is not a web link', () => {
    renderHeader(
      chatSession({
        phone: '',
        ticketReference: '',
        pageUrl: 'about:blank',
        site: WebsiteChatSite.Tools,
        status: WebsiteChatStatus.Closed,
        expiresAt: '2026-10-01T10:30:00.000Z',
        slackLinked: true,
      }),
    );

    expect(detail('Phone')).toHaveTextContent('—');
    expect(detail('Ticket')).toHaveTextContent('—');
    expect(detail('Page')).toHaveTextContent('about:blank');
    expect(screen.queryByRole('link', { name: 'about:blank' })).not.toBeInTheDocument();
    expect(detail('Site')).toHaveTextContent('Tools site');
    expect(screen.getByText('Slack thread')).toBeInTheDocument();
    expect(screen.queryByText(/^Closes at/)).not.toBeInTheDocument();
  });

  it('shows a dash when the page is unknown, and no countdown without an expiry', () => {
    renderHeader(chatSession({ pageUrl: '' }));

    expect(detail('Page')).toHaveTextContent('—');
    expect(screen.queryByText(/^Closes at/)).not.toBeInTheDocument();
  });
});
