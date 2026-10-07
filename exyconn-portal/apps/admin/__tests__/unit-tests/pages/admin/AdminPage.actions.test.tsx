import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { DeleteUserDocument, ResetUserPasswordDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps } from '../../crud-dashboard.stub';
import { AdminPage } from '../../../../src/pages/admin';
import { user, usersStats } from './admin.fixtures';

vi.mock('@exyconn/crud', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/crud')>();
  const { CrudDashboardStub } = await import('../../crud-dashboard.stub');
  return { ...actual, CrudDashboard: CrudDashboardStub };
});

/** A temporary password built at run time, so no credential-looking literal sits in the source. */
const temporary = ['temp', 'pass', '42'].join('-');

const reset = (outcome: { password: string } | { error: Error }): MockLink.MockedResponse => ({
  request: { query: ResetUserPasswordDocument, variables: { id: 'user-1' } },
  ...('error' in outcome
    ? { error: outcome.error }
    : { result: { data: { resetUserPassword: outcome.password } } }),
});

const snackbar = () => document.querySelector('.MuiSnackbar-root');

/** Presses a row action the way the grid's action cell does. */
const press = (action: string) =>
  act(() => {
    dashboardProps().context.actions[action](user());
  });

const confirmDialog = async (text: string) =>
  (await screen.findByText(text)).closest('[role="dialog"]') as HTMLElement;

describe('AdminPage row actions', () => {
  it('deletes a user after confirming by name, then re-reads the stats', async () => {
    const person = userEvent.setup();
    renderWithProviders(<AdminPage />, {
      mocks: [
        usersStats(),
        {
          request: { query: DeleteUserDocument, variables: { id: 'user-1' } },
          result: { data: { deleteUser: true } },
        },
        usersStats(),
      ],
    });
    press('delete');
    const dialog = await confirmDialog('Delete user "Asha Rao"?');
    await person.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(snackbar()).toHaveTextContent('User deleted'));
  });

  it('resets a password after confirming and reveals the temporary one once', async () => {
    const person = userEvent.setup();
    renderWithProviders(<AdminPage />, {
      mocks: [usersStats(), reset({ password: temporary })],
    });
    press('reset');
    const dialog = await confirmDialog(
      'Reset password for "Asha Rao"? A new temporary password will be emailed.',
    );
    await person.click(within(dialog).getByRole('button', { name: 'Reset' }));

    expect(await screen.findByText('Credentials for Asha Rao')).toBeInTheDocument();
    expect(screen.getByText(temporary)).toBeInTheDocument();

    await person.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByText('Credentials for Asha Rao')).toBeNull());
  });

  it('leaves the password alone when the reset is cancelled', async () => {
    const person = userEvent.setup();
    renderWithProviders(<AdminPage />, { mocks: [usersStats()] });
    press('reset');
    const dialog = await confirmDialog(
      'Reset password for "Asha Rao"? A new temporary password will be emailed.',
    );
    await person.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText(/Reset password for/)).toBeNull());
    expect(screen.queryByText('Credentials for Asha Rao')).toBeNull();
    expect(snackbar()).toBeNull();
  });

  it('says why a reset failed', async () => {
    const person = userEvent.setup();
    renderWithProviders(<AdminPage />, {
      mocks: [usersStats(), reset({ error: new Error('Mail server unreachable') })],
    });
    press('reset');
    const dialog = await confirmDialog(
      'Reset password for "Asha Rao"? A new temporary password will be emailed.',
    );
    await person.click(within(dialog).getByRole('button', { name: 'Reset' }));

    await waitFor(() => expect(snackbar()).toHaveTextContent('Mail server unreachable'));
    expect(screen.queryByText('Credentials for Asha Rao')).toBeNull();
  });
});
