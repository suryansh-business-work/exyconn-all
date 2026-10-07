import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMySupportRepliesQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult, type QueryShape } from './helpers/apollo';
import { SupportThread } from '../../../../src/pages/employee/SupportThread';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMySupportRepliesQuery: vi.fn(),
}));
vi.mock('../../../../src/pages/employee/forms/support-reply', async () => {
  const { FormStub } = await import('./helpers/stubs');
  return { SupportReplyForm: FormStub };
});

const screenshot = {
  url: 'https://files.example.com/vpn.png',
  name: 'vpn.png',
  contentType: 'image/png',
};

const reply = {
  id: 'rep1',
  ticketId: 't1',
  authorId: 'agent1',
  authorName: 'Ravi from IT',
  body: 'Please reinstall the client.',
  createdAt: '2026-03-03T11:00:00.000Z',
  attachments: [
    {
      url: 'https://files.example.com/guide.pdf',
      name: 'guide.pdf',
      contentType: 'application/pdf',
      uploadedBy: 'agent1',
      uploadedAt: '2026-03-03T11:00:00.000Z',
    },
  ],
};

function renderThread(query: QueryShape) {
  const onClose = vi.fn();
  vi.mocked(useMySupportRepliesQuery).mockReturnValue(queryResult(query));
  renderWithProviders(
    <SupportThread
      ticketId="t1"
      description="VPN drops every 10 minutes."
      attachments={[screenshot]}
      onClose={onClose}
    />,
  );
  return { onClose, user: userEvent.setup() };
}

describe('SupportThread', () => {
  it("shows what the employee wrote and attached, then support's replies", () => {
    renderThread({ data: { mySupportReplies: [reply] } });

    expect(useMySupportRepliesQuery).toHaveBeenCalledWith({
      variables: { ticketId: 't1' },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByText('VPN drops every 10 minutes.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'vpn.png' })).toHaveAttribute('src', screenshot.url);
    expect(screen.getByText('Ravi from IT')).toBeInTheDocument();
    expect(screen.getByText('at 2026-03-03T11:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('Please reinstall the client.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'guide.pdf' })).toHaveAttribute(
      'href',
      'https://files.example.com/guide.pdf',
    );
  });

  it('says it is loading before the first replies arrive', () => {
    renderThread({ loading: true });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('says support will answer here when there are no replies yet', () => {
    renderThread({ data: { mySupportReplies: [] } });
    expect(screen.getByText('No replies yet — support will answer you here.')).toBeInTheDocument();
  });

  it('lets the employee reply on this ticket, reloading the thread after', async () => {
    const refetch = vi.fn(() => Promise.resolve({}));
    const { user } = renderThread({ data: { mySupportReplies: [] }, refetch });

    expect(screen.getByTestId('form-stub')).toHaveAttribute('data-ticket', 't1');
    await user.click(screen.getByRole('button', { name: 'Stub done' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('closes when the reply form is cancelled', async () => {
    const { onClose, user } = renderThread({ data: { mySupportReplies: [] } });
    await user.click(screen.getByRole('button', { name: 'Stub cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the thread up when the reload after a reply fails', async () => {
    const refetch = vi.fn(() => Promise.reject(new Error('offline')));
    const { user } = renderThread({ data: { mySupportReplies: [] }, refetch });
    await user.click(screen.getByRole('button', { name: 'Stub done' }));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('VPN drops every 10 minutes.')).toBeInTheDocument();
  });
});
