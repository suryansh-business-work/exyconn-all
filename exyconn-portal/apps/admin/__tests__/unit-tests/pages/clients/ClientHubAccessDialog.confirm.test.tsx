import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { ClientHubAccessDialog } from '../../../../src/pages/clients/hub-access/ClientHubAccessDialog';
import { contact, contactsAnswer } from './hub-access.fixtures';

const failure = new Error('Confirmation unavailable');

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfirm: () => () => Promise.reject(failure),
}));

afterEach(() => vi.restoreAllMocks());

describe('ClientHubAccessDialog when the removal confirmation fails', () => {
  it('logs the failure and keeps the person on the list', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders(
      <ClientHubAccessDialog client={{ id: 'client-1', name: 'Acme' }} onClose={vi.fn()} />,
      {
        mocks: [contactsAnswer([contact()])],
      },
    );
    const row = within(
      (await screen.findByText('meera@acme.example')).closest('tr') as HTMLElement,
    );

    await userEvent.click(row.getByRole('button', { name: 'delete' }));

    await waitFor(() => expect(logged).toHaveBeenCalledWith(failure));
    expect(screen.getByText('meera@acme.example')).toBeInTheDocument();
  });
});
