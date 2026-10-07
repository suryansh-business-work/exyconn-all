import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SupportCategory, SupportPriority } from '@exyconn/shell/graphql/generated';
import {
  CLIENT_TICKET_LIMITS,
  ClientTicketForm,
} from '../../../../../../src/pages/support/forms/client-ticket';
import { renderWithProviders } from '../../../../test-utils';
import { click, fill, pickOption } from '../../../../form.helpers';

const gql = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateClientSupportTicketMutation: () => [gql.create],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const DESCRIPTION = 'The portal shows a blank page after signing in.';

const renderForm = () =>
  renderWithProviders(<ClientTicketForm onDone={onDone} onCancel={onCancel} />);

/** Fills every required field with a valid value. */
const fillValid = () => {
  fill('Customer name', '  Dana Reyes ');
  fill('Customer email', ' dana@acme.test ');
  fill('Subject', 'Portal will not load');
  fill('Description', DESCRIPTION);
};

describe('ClientTicketForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: { createClientSupportTicket: 'SUP-0042' } });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('opens empty, as an Other ticket at Medium priority, with a hint on the address', () => {
    renderForm();
    expect(screen.getByLabelText('Customer name')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /^Category/ })).toHaveTextContent('Other');
    expect(screen.getByRole('combobox', { name: /^Priority/ })).toHaveTextContent('Medium');
    expect(
      screen.getByText('Matched against the client book; replies go to this address.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Raise ticket' })).toBeInTheDocument();
  });

  it('refuses an empty form, saying what each field needs', async () => {
    renderForm();
    await click('Raise ticket');
    expect(await screen.findByText('Give the customer’s name')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Add a short subject')).toBeInTheDocument();
    expect(screen.getByText('Describe the issue in a bit more detail')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses an address that is not one', async () => {
    renderForm();
    fillValid();
    fill('Customer email', 'dana@acme');
    await click('Raise ticket');
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses anything longer than the server accepts', async () => {
    const { name, subject, description } = CLIENT_TICKET_LIMITS;
    renderForm();
    fillValid();
    fill('Customer name', 'n'.repeat(name.max + 1));
    fill('Subject', 's'.repeat(subject.max + 1));
    fill('Description', 'd'.repeat(description.max + 1));
    await click('Raise ticket');
    expect(await screen.findByText('At most 80 characters')).toBeInTheDocument();
    expect(screen.getByText('At most 120 characters')).toBeInTheDocument();
    expect(screen.getByText('At most 4000 characters')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('raises the ticket trimmed, names its reference and starts a fresh form', async () => {
    renderForm();
    fillValid();
    await pickOption(/^Category/, 'It');
    await pickOption(/^Priority/, 'High');
    await click('Raise ticket');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          requesterName: 'Dana Reyes',
          requesterEmail: 'dana@acme.test',
          subject: 'Portal will not load',
          category: SupportCategory.It,
          description: DESCRIPTION,
          priority: SupportPriority.High,
        },
      },
    });
    expect(await screen.findByText('Ticket SUP-0042 raised')).toBeInTheDocument();
    expect(screen.getByLabelText('Customer name')).toHaveValue('');
    expect(screen.getByLabelText('Subject')).toHaveValue('');
  });

  it('still confirms the ticket when the server returns no reference', async () => {
    gql.create.mockResolvedValue({ data: null });
    renderForm();
    fillValid();
    await click('Raise ticket');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Ticket raised')).toBeInTheDocument();
  });

  it('keeps what was typed and says why when the server refuses', async () => {
    gql.create.mockRejectedValue(new Error('Too many tickets from this address'));
    renderForm();
    fillValid();
    await click('Raise ticket');

    expect(await screen.findByText('Too many tickets from this address')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Subject')).toHaveValue('Portal will not load');
  });

  it('falls back to a plain failure message when the error says nothing', async () => {
    gql.create.mockRejectedValue('offline');
    renderForm();
    fillValid();
    await click('Raise ticket');

    expect(await screen.findByText('Could not raise the ticket')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without raising anything', async () => {
    renderForm();
    await click('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
