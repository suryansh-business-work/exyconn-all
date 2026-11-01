import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { useSupportTicketSourceQuery } from '@/graphql/generated';
import { TicketSource } from '@/pages/ticket-desk/TicketSource';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useSupportTicketSourceQuery: vi.fn(),
}));

const chat = {
  channel: 'CHAT',
  contact: 'Asha Rao <asha@acme.test>',
  status: 'OPEN',
  detail: 'Any news on my refund?',
  messageCount: 7,
  lastActivityAt: '2026-10-30T09:15:00.000Z',
  url: 'https://agents.exyconn.com/agents/chat/sessions/s-1',
};

function renderSource(channel: string, source: unknown, extras = {}) {
  vi.mocked(useSupportTicketSourceQuery).mockReturnValue(
    queryResult(
      source === undefined ? undefined : { supportTicketSource: source },
      extras,
    ) as never,
  );
  return renderWithProviders(<TicketSource ticketId="t-1" channel={channel} />);
}

beforeEach(() => {
  vi.mocked(useSupportTicketSourceQuery).mockReset();
});

describe('TicketSource', () => {
  it('does not ask for a conversation behind a portal, email or agent ticket', () => {
    const { container } = renderSource('EMAIL', chat);

    expect(container).toBeEmptyDOMElement();
    expect(useSupportTicketSourceQuery).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { ticketId: 't-1' }, skip: true }),
    );
  });

  it('shows the live website chat with a link to open it in a new tab', () => {
    renderSource('CHAT', chat);

    expect(useSupportTicketSourceQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: false, fetchPolicy: 'cache-and-network' }),
    );
    expect(screen.getByText('Asha Rao <asha@acme.test>')).toBeInTheDocument();
    expect(screen.getByText('Any news on my refund?')).toBeInTheDocument();
    expect(screen.getByText(/^Last activity (?!—).+/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Open the conversation' });
    expect(link).toHaveAttribute('href', chat.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows a WhatsApp chat with no detail, no activity and no link as such', () => {
    renderSource('WHATSAPP', {
      ...chat,
      channel: 'WHATSAPP',
      contact: '+••••••••3210',
      detail: '',
      lastActivityAt: null,
      url: '',
    });

    expect(screen.getByText('+••••••••3210')).toBeInTheDocument();
    expect(screen.getByText('Last activity —')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText('Any news on my refund?')).not.toBeInTheDocument();
  });

  it('shows nothing while loading or when the conversation is gone', () => {
    expect(renderSource('CHAT', undefined).container).toBeEmptyDOMElement();
    expect(renderSource('CHAT', null).container).toBeEmptyDOMElement();
  });

  it('warns when the conversation cannot be loaded', () => {
    renderSource('CHAT', undefined, { error: new Error('boom') });

    expect(screen.getByText('The linked conversation could not be loaded.')).toBeInTheDocument();
  });
});
