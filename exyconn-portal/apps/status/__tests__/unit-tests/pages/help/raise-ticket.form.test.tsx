import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { SupportCategory, SupportPriority } from '@exyconn/shell/graphql/generated';
import { RaiseTicketForm } from '../../../../src/pages/help/forms/raise-ticket';
import { renderWithProviders } from '../../test-utils';
import { fill, findSnackbar, pickOption } from '../../form-helpers';
import { REFERENCE, raised, ticketInput } from './help.fixtures';

function renderForm(mocks: MockLink.MockedResponse[] = []) {
  const onSubmitted = vi.fn<(reference: string) => void>();
  const onCancel = vi.fn<() => void>();
  renderWithProviders(<RaiseTicketForm onSubmitted={onSubmitted} onCancel={onCancel} />, {
    mocks,
  });
  return { onSubmitted, onCancel };
}

function fillTicket(values = ticketInput) {
  fill('Your name', ` ${values.requesterName} `);
  fill('Your email', values.requesterEmail);
  fill('Title', values.subject);
  fill('What is happening?', values.description);
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Ask for help' }));

describe('RaiseTicketForm', () => {
  it('says what each empty field needs and sends nothing', async () => {
    const { onSubmitted } = renderForm();
    await submit();

    expect(await screen.findByText('Tell us who you are')).toBeInTheDocument();
    expect(screen.getByText('We need an address to reply to')).toBeInTheDocument();
    expect(screen.getByText('One line about what is wrong')).toBeInTheDocument();
    expect(screen.getByText('A few sentences help us pick it up faster')).toBeInTheDocument();
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('refuses an address that cannot be replied to', async () => {
    renderForm();
    fillTicket({ ...ticketInput, requesterEmail: 'ada at example' });
    await submit();
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
  });

  it('sends the chosen category and urgency, then clears itself and hands back the reference', async () => {
    const input = {
      ...ticketInput,
      category: SupportCategory.Payroll,
      priority: SupportPriority.High,
    };
    const { onSubmitted } = renderForm([raised(input)]);
    fillTicket(input);
    await pickOption(/What is it about/, 'Payroll');
    await pickOption(/How urgent is it/, 'High');
    await submit();

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(REFERENCE));
    expect(screen.getByLabelText('Your name')).toHaveValue('');
  });

  it('keeps what was typed and says why when the ticket cannot be raised', async () => {
    const { onSubmitted } = renderForm([raised(ticketInput, new Error('Slow down a little'))]);
    fillTicket();
    await submit();

    expect(await findSnackbar('Slow down a little')).toBeInTheDocument();
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Title')).toHaveValue(ticketInput.subject);
  });

  it('cancels on request', async () => {
    const { onCancel } = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
