import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { useListSupportRepliesQuery } from '@/graphql/generated';
import { TicketThread } from '@/pages/ticket-desk/TicketThread';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useListSupportRepliesQuery: vi.fn(),
}));

const reply = {
  id: 'r-1',
  ticketId: 't-1',
  authorId: 'u-1',
  authorName: 'Asha',
  body: 'Have you tried restarting?',
  internal: false,
  createdAt: '2026-05-01T09:00:00.000Z',
  attachments: [],
};
const note = {
  ...reply,
  id: 'r-2',
  authorName: 'Ben',
  body: 'Customer is on the old plan.',
  internal: true,
  attachments: [
    {
      url: 'https://cdn.example.com/log.pdf',
      name: 'log.pdf',
      contentType: 'application/pdf',
      uploadedBy: 'u-2',
      uploadedAt: '2026-05-01T09:00:00.000Z',
    },
  ],
};

function renderThread(replies: unknown[] | null, loading = false) {
  vi.mocked(useListSupportRepliesQuery).mockReturnValue(
    queryResult(replies ? { listSupportReplies: replies } : undefined, { loading }) as never,
  );
  renderWithProviders(<TicketThread ticketId="t-1" />);
}

describe('TicketThread', () => {
  it('says the thread is loading before anything arrives', () => {
    renderThread(null, true);
    expect(screen.getByText('Loading the thread…')).toBeInTheDocument();
  });

  it('says nothing has been said yet on an empty thread', () => {
    renderThread([]);
    expect(screen.getByText('Nothing has been said on this ticket yet.')).toBeInTheDocument();
  });

  it('shows every message, labelling internal notes and their attachments', () => {
    renderThread([reply, note], true);

    expect(useListSupportRepliesQuery).toHaveBeenCalledWith({
      variables: { ticketId: 't-1' },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByText('Have you tried restarting?')).toBeInTheDocument();
    expect(screen.getByText('Customer is on the old plan.')).toBeInTheDocument();
    expect(screen.getAllByText('Internal note')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /log\.pdf/ })).toHaveAttribute(
      'href',
      'https://cdn.example.com/log.pdf',
    );
  });
});
