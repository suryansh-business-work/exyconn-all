import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { CredentialsDialog } from '../../../../src/pages/admin/CredentialsDialog';

const clipboard = vi.hoisted(() => ({
  copyToClipboard: vi.fn<(text: string) => Promise<boolean>>(),
}));
vi.mock('@exyconn/shell/utils/clipboard', () => clipboard);

/** A one-time password built at run time, so no credential-looking literal sits in the source. */
const oneTimePassword = ['tmp', 'pw', String(Date.now() % 1000)].join('-');
const CREDENTIALS = { name: 'Asha Rao', email: 'asha@example.com', password: oneTimePassword };

const snackbar = () => document.querySelector('.MuiSnackbar-root');

beforeEach(() => {
  clipboard.copyToClipboard.mockReset();
  clipboard.copyToClipboard.mockResolvedValue(true);
});

describe('CredentialsDialog', () => {
  it('renders nothing until there are credentials to hand over', () => {
    renderWithProviders(<CredentialsDialog credentials={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the email and the one-time password for the named user', () => {
    renderWithProviders(<CredentialsDialog credentials={CREDENTIALS} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Credentials for Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('asha@example.com')).toBeInTheDocument();
    expect(screen.getByText(oneTimePassword)).toBeInTheDocument();
    expect(screen.getByText(/The password is shown only once/)).toBeInTheDocument();
  });

  it('copies each field on its own and says which one was copied', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CredentialsDialog credentials={CREDENTIALS} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'copy Email' }));
    expect(clipboard.copyToClipboard).toHaveBeenLastCalledWith('asha@example.com');
    await waitFor(() => expect(snackbar()).toHaveTextContent('Email copied'));

    await user.click(screen.getByRole('button', { name: 'copy Password' }));
    expect(clipboard.copyToClipboard).toHaveBeenLastCalledWith(oneTimePassword);
    await waitFor(() => expect(snackbar()).toHaveTextContent('Password copied'));
  });

  it('copies both as one block of text', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CredentialsDialog credentials={CREDENTIALS} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Copy both' }));
    expect(clipboard.copyToClipboard).toHaveBeenCalledWith(
      `Email: asha@example.com\nPassword: ${oneTimePassword}`,
    );
    await waitFor(() => expect(snackbar()).toHaveTextContent('Credentials copied'));
  });

  it('says so when the clipboard refuses the copy', async () => {
    clipboard.copyToClipboard.mockResolvedValue(false);
    const user = userEvent.setup();
    renderWithProviders(<CredentialsDialog credentials={CREDENTIALS} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'copy Email' }));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Copy failed'));
  });

  it('closes on Done', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<CredentialsDialog credentials={CREDENTIALS} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
