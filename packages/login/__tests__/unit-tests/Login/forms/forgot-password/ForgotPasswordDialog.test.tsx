import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';

const requestReset = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useRequestPasswordResetMutation: () => [requestReset],
}));

const { ForgotPasswordDialog } = await import('../../../../../src/Login/forms/forgot-password');

describe('ForgotPasswordDialog', () => {
  it('renders nothing while closed', () => {
    renderWithProviders(<ForgotPasswordDialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes on cancel', async () => {
    const onClose = vi.fn();
    renderWithProviders(<ForgotPasswordDialog open onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Reset your password' })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes once the link has been requested', async () => {
    requestReset.mockResolvedValue({ data: { requestPasswordReset: true } });
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordDialog open onClose={onClose} />);
    await user.type(screen.getByLabelText('Email'), 'asha@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
