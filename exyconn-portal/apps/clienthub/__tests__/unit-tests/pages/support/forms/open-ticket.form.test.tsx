import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupportCategory, SupportPriority } from '@exyconn/shell/graphql/generated';
import { OpenTicketForm } from '../../../../../src/pages/support/forms/open-ticket';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ useClientHubOpenTicketMutation: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const SUBJECT = 'Invoice total looks wrong';
const DESCRIPTION = 'The March invoice charges twice for the same week of work.';
const openTicket = vi.fn();
const onDone = vi.fn();
const onCancel = vi.fn();

function renderForm() {
  renderWithProviders(<OpenTicketForm onDone={onDone} onCancel={onCancel} />);
  return userEvent.setup();
}

type User = ReturnType<typeof userEvent.setup>;

async function fill(user: User) {
  await user.type(screen.getByLabelText('Subject'), SUBJECT);
  await user.click(screen.getByLabelText('Describe the problem'));
  await user.paste(DESCRIPTION);
}

const send = (user: User) => user.click(screen.getByRole('button', { name: 'Create' }));

async function fillAndSend(user: User) {
  await fill(user);
  await send(user);
}

describe('OpenTicketForm', () => {
  beforeEach(() => gql.useClientHubOpenTicketMutation.mockReturnValue([openTicket, {}]));
  afterEach(() => vi.clearAllMocks());

  it('asks for a title and a description before raising anything', async () => {
    const user = renderForm();
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('One line about what is wrong')).toBeInTheDocument();
    expect(screen.getByText('A few sentences help us pick it up faster')).toBeInTheDocument();
    expect(openTicket).not.toHaveBeenCalled();
  });

  it('starts about something else, at medium priority', () => {
    renderForm();
    expect(screen.getByRole('combobox', { name: /What is it about\?/ })).toHaveTextContent('Other');
    expect(screen.getByRole('combobox', { name: /How urgent is it\?/ })).toHaveTextContent(
      'Medium',
    );
  });

  it('raises the ticket with the chosen urgency and confirms its reference', async () => {
    openTicket.mockResolvedValue({
      data: { clientHubOpenTicket: { id: 't-7', reference: 'TCK-7' } },
    });
    const user = renderForm();
    await fill(user);
    await user.click(screen.getByRole('combobox', { name: /How urgent is it\?/ }));
    await user.click(await screen.findByRole('option', { name: 'High' }));
    // The menu keeps the rest of the page hidden from assistive tech until it has closed.
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await send(user);
    expect(
      await screen.findByText('Ticket TCK-7 raised — we will reply here and by email'),
    ).toBeInTheDocument();
    expect(openTicket).toHaveBeenCalledWith({
      variables: {
        input: {
          subject: SUBJECT,
          category: SupportCategory.Other,
          description: DESCRIPTION,
          priority: SupportPriority.High,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('still finishes when the server confirms without a reference', async () => {
    openTicket.mockResolvedValue({ data: undefined });
    const user = renderForm();
    await fillAndSend(user);
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/raised — we will reply here and by email/)).toBeInTheDocument();
  });

  it("shows the server's reason and stays open when the ticket cannot be raised", async () => {
    openTicket.mockRejectedValue(new Error('Too many open tickets'));
    const user = renderForm();
    await fillAndSend(user);
    expect(await screen.findByText('Too many open tickets')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    openTicket.mockRejectedValue('offline');
    const user = renderForm();
    await fillAndSend(user);
    expect(await screen.findByText('The ticket could not be raised')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('can be abandoned', async () => {
    const user = renderForm();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(openTicket).not.toHaveBeenCalled();
  });
});
