import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { AddClientContactDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { ClientContactForm } from '../../../../src/pages/clients/hub-access/forms/client-contact';
import { contact } from './hub-access.fixtures';

const INPUT = { clientId: 'client-1', name: 'Ravi Kumar', email: 'ravi@acme.example' };

const added = (outcome: { error: Error } | 'ok'): MockLink.MockedResponse => ({
  request: { query: AddClientContactDocument, variables: { input: INPUT } },
  ...(outcome === 'ok'
    ? { result: { data: { addClientContact: contact({ name: INPUT.name, email: INPUT.email }) } } }
    : { error: outcome.error }),
});

const nameField = () => screen.getByRole('textbox', { name: 'Name' });
const emailField = () => screen.getByRole('textbox', { name: 'Email' });
const snackbar = () => document.querySelector('.MuiSnackbar-root');

async function fill(user: ReturnType<typeof userEvent.setup>, name: string, email: string) {
  await user.type(nameField(), name);
  await user.type(emailField(), email);
  await user.click(screen.getByRole('button', { name: 'Give access' }));
}

describe('ClientContactForm', () => {
  it('requires a name and an email', async () => {
    const user = userEvent.setup();
    const onAdded = vi.fn();
    renderWithProviders(<ClientContactForm clientId="client-1" onAdded={onAdded} />);
    expect(
      screen.getByText('They sign in with this address and an emailed code'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Give access' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(onAdded).not.toHaveBeenCalled();
  });

  it('rejects a malformed email and a name over 120 characters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientContactForm clientId="client-1" onAdded={vi.fn()} />);
    await fill(user, 'x'.repeat(121), 'ravi@');

    expect(await screen.findByText('Keep the name under 120 characters')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });

  it('gives access with the trimmed details, confirms, and clears the form', async () => {
    const user = userEvent.setup();
    const onAdded = vi.fn();
    renderWithProviders(<ClientContactForm clientId="client-1" onAdded={onAdded} />, {
      mocks: [added('ok')],
    });
    await fill(user, ' Ravi Kumar ', 'ravi@acme.example');

    await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(1));
    expect(snackbar()).toHaveTextContent('Access given — ravi@acme.example has been emailed');
    expect(nameField()).toHaveValue('');
    expect(emailField()).toHaveValue('');
  });

  it('shows why access could not be given, and keeps what was typed', async () => {
    const user = userEvent.setup();
    const onAdded = vi.fn();
    renderWithProviders(<ClientContactForm clientId="client-1" onAdded={onAdded} />, {
      mocks: [added({ error: new Error('That email already has access') })],
    });
    await fill(user, 'Ravi Kumar', 'ravi@acme.example');

    expect(await screen.findByRole('alert')).toHaveTextContent('That email already has access');
    expect(nameField()).toHaveValue('Ravi Kumar');
    expect(onAdded).not.toHaveBeenCalled();
  });
});
