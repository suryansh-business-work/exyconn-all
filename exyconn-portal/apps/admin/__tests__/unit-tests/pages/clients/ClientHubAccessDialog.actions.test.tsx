import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import {
  DeleteClientContactDocument,
  SetClientContactActiveDocument,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { ClientHubAccessDialog } from '../../../../src/pages/clients/hub-access/ClientHubAccessDialog';
import { contact, contactsAnswer, dormant } from './hub-access.fixtures';

const ACME = { id: 'client-1', name: 'Acme' };

const switched = (id: string, active: boolean, error?: Error): MockLink.MockedResponse => ({
  request: { query: SetClientContactActiveDocument, variables: { id, active } },
  ...(error
    ? { error }
    : { result: { data: { setClientContactActive: { ...contact({ id }), active } } } }),
});

const removed: MockLink.MockedResponse = {
  request: { query: DeleteClientContactDocument, variables: { id: 'contact-1' } },
  result: { data: { deleteClientContact: true } },
};

const rowOf = async (email: string) =>
  within((await screen.findByText(email)).closest('tr') as HTMLElement);

const snackbar = () => document.querySelector('.MuiSnackbar-root');

const renderDialog = (mocks: MockLink.MockedResponse[]) =>
  renderWithProviders(<ClientHubAccessDialog client={ACME} onClose={vi.fn()} />, { mocks });

describe('ClientHubAccessDialog actions', () => {
  it('switches access off, confirms and re-reads the list', async () => {
    const user = userEvent.setup();
    renderDialog([
      contactsAnswer([contact()]),
      switched('contact-1', false),
      contactsAnswer([contact({ active: false })]),
    ]);
    const row = await rowOf('meera@acme.example');
    await user.click(row.getByRole('button', { name: 'switch client hub access off' }));

    await waitFor(() => expect(snackbar()).toHaveTextContent('Access switched off'));
    expect((await rowOf('meera@acme.example')).getByText('INACTIVE')).toBeInTheDocument();
  });

  it('switches access back on', async () => {
    const user = userEvent.setup();
    renderDialog([
      contactsAnswer([dormant()]),
      switched('contact-2', true),
      contactsAnswer([{ ...dormant(), active: true }]),
    ]);
    const row = await rowOf('kiran@acme.example');
    await user.click(row.getByRole('button', { name: 'switch client hub access on' }));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Access restored'));
  });

  it('says why a switch failed', async () => {
    const user = userEvent.setup();
    renderDialog([
      contactsAnswer([contact()]),
      switched('contact-1', false, new Error('Client is archived')),
    ]);
    const row = await rowOf('meera@acme.example');
    await user.click(row.getByRole('button', { name: 'switch client hub access off' }));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Client is archived'));
  });

  it('removes somebody from the hub after confirming by email', async () => {
    const user = userEvent.setup();
    renderDialog([contactsAnswer([contact()]), removed, contactsAnswer([])]);
    const row = await rowOf('meera@acme.example');
    await user.click(row.getByRole('button', { name: 'delete' }));

    const message = await screen.findByText('Remove meera@acme.example from the client hub?');
    const dialog = within(message.closest('[role="dialog"]') as HTMLElement);
    expect(dialog.getByText('Remove access')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(snackbar()).toHaveTextContent('Access removed'));
    expect(await screen.findByText('Nobody at this client has access yet.')).toBeInTheDocument();
  });

  it('keeps somebody when the removal is declined', async () => {
    const user = userEvent.setup();
    renderDialog([contactsAnswer([contact()])]);
    const row = await rowOf('meera@acme.example');
    await user.click(row.getByRole('button', { name: 'delete' }));

    const message = await screen.findByText('Remove meera@acme.example from the client hub?');
    const dialog = within(message.closest('[role="dialog"]') as HTMLElement);
    await user.click(dialog.getByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(screen.queryByText('Remove meera@acme.example from the client hub?')).toBeNull(),
    );
    expect(screen.getByText('meera@acme.example')).toBeInTheDocument();
    expect(snackbar()).toBeNull();
  });
});
