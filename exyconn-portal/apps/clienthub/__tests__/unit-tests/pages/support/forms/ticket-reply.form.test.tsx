import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketReplyForm } from '../../../../../src/pages/support/forms/ticket-reply';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ useClientHubReplyToTicketMutation: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const reply = vi.fn();
const onReplied = vi.fn();

function renderForm() {
  renderWithProviders(<TicketReplyForm ticketId="t-1" onReplied={onReplied} />);
  return userEvent.setup();
}

const replyField = () => screen.getByLabelText('Your reply');
const sendButton = () => screen.getByRole('button', { name: 'Send reply' });

describe('TicketReplyForm', () => {
  beforeEach(() => gql.useClientHubReplyToTicketMutation.mockReturnValue([reply, {}]));
  afterEach(() => vi.clearAllMocks());

  it('will not send an empty reply', async () => {
    const user = renderForm();
    await user.type(replyField(), '   ');
    await user.click(sendButton());
    expect(await screen.findByText('Write a reply')).toBeInTheDocument();
    expect(reply).not.toHaveBeenCalled();
  });

  it('sends the reply on this ticket, clears the box and reports back', async () => {
    reply.mockResolvedValue({ data: { clientHubReplyToTicket: { id: 'r-2' } } });
    const user = renderForm();
    await user.type(replyField(), '  That fixed it, thanks ');
    await user.click(sendButton());
    await waitFor(() => expect(onReplied).toHaveBeenCalledTimes(1));
    expect(reply).toHaveBeenCalledWith({
      variables: { ticketId: 't-1', body: 'That fixed it, thanks' },
    });
    expect(replyField()).toHaveValue('');
  });

  it("keeps the reply and shows the server's reason when it cannot be sent", async () => {
    reply.mockRejectedValue(new Error('This ticket is closed'));
    const user = renderForm();
    await user.type(replyField(), 'One more thing');
    await user.click(sendButton());
    expect(await screen.findByText('This ticket is closed')).toBeInTheDocument();
    expect(onReplied).not.toHaveBeenCalled();
    expect(replyField()).toHaveValue('One more thing');
  });

  it('falls back to a plain message when the failure carries none', async () => {
    reply.mockRejectedValue('offline');
    const user = renderForm();
    await user.type(replyField(), 'One more thing');
    await user.click(sendButton());
    expect(await screen.findByText('The reply could not be sent')).toBeInTheDocument();
  });
});
