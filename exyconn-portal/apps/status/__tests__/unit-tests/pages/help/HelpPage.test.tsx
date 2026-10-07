import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpPage } from '../../../../src/pages/help';
import { renderWithProviders } from '../../test-utils';
import { CurrentUrl, currentUrl, fill } from '../../form-helpers';
import { REFERENCE, raised, ticketInput } from './help.fixtures';

function renderHelp(mocks = [raised()]) {
  renderWithProviders(
    <>
      <HelpPage />
      <CurrentUrl />
    </>,
    { mocks, route: '/help' },
  );
  const [raiseForm, checkForm] = Array.from(document.querySelectorAll('form'));
  return { raiseForm, checkForm, forms: [raiseForm, checkForm] };
}

function raiseTicket(form: HTMLElement) {
  fill('Your name', ticketInput.requesterName, form);
  fill('Your email', ticketInput.requesterEmail, form);
  fill('Title', ticketInput.subject, form);
  fill('What is happening?', ticketInput.description, form);
  return userEvent.click(within(form).getByRole('button', { name: 'Ask for help' }));
}

describe('HelpPage', () => {
  it('offers both halves: raising a ticket and following one', () => {
    const { raiseForm, checkForm } = renderHelp();
    expect(screen.getByRole('heading', { name: 'Get help' })).toBeInTheDocument();
    expect(screen.getByText('Follow a ticket')).toBeInTheDocument();
    expect(within(raiseForm).getByLabelText('What is it about?')).toBeInTheDocument();
    expect(within(checkForm).getByLabelText('Ticket reference')).toBeInTheDocument();
  });

  it('hands over the reference once the ticket is raised, and comes back for another', async () => {
    const { raiseForm } = renderHelp();
    await raiseTicket(raiseForm);

    expect(await screen.findByText('We have it')).toBeInTheDocument();
    expect(screen.getByText(REFERENCE)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ask about something else' }));
    expect(screen.getByText('Follow a ticket')).toBeInTheDocument();
    expect(screen.getByLabelText('Your name')).toHaveValue('');
  });

  it('goes back to the status page from the receipt', async () => {
    const { raiseForm } = renderHelp();
    await raiseTicket(raiseForm);
    await userEvent.click(await screen.findByRole('button', { name: 'Back to status' }));
    expect(currentUrl()).toBe('/');
  });

  it.each([
    ['raise', 0],
    ['follow', 1],
  ])('leaves for the status page from the %s form’s Cancel', async (_form, index) => {
    const { forms } = renderHelp();
    expect(currentUrl()).toBe('/help');
    await userEvent.click(within(forms[index]).getByRole('button', { name: 'Cancel' }));
    expect(currentUrl()).toBe('/');
  });
});
