import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { renderWithProviders } from '../../../test-utils';

const resetPassword = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useResetPasswordMutation: () => [resetPassword],
}));

const { ResetPasswordForm, PASSWORD_RESET_MESSAGE } =
  await import('../../../../../src/ResetPassword/forms/reset-password');

const LINK_TOKEN = 'link-token-1';
const typed = (length: number) => 'n'.repeat(length);

function renderForm() {
  const user = userEvent.setup();
  renderWithProviders(<ResetPasswordForm token={LINK_TOKEN} accentColor="#1a237e" />, {
    route: '/reset-password',
    routes: <Route path="/login" element={<p>sign-in page</p>} />,
  });
  return user;
}

async function fill(user: ReturnType<typeof userEvent.setup>, first: string, second: string) {
  if (first) await user.type(screen.getByPlaceholderText('new password'), first);
  if (second) await user.type(screen.getByPlaceholderText('confirm new password'), second);
  await user.click(screen.getByRole('button', { name: 'Set new password' }));
}

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    resetPassword.mockReset();
  });

  it('requires both fields', async () => {
    const user = renderForm();
    expect(screen.getByPlaceholderText('new password')).toHaveFocus();
    await fill(user, '', '');
    expect(await screen.findByText('New password is required')).toBeInTheDocument();
    expect(screen.getByText('Confirm your new password')).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('enforces the ten-character minimum', async () => {
    const user = renderForm();
    await fill(user, typed(9), typed(9));
    expect(await screen.findByText('Minimum 10 characters')).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('enforces the 128-character maximum', async () => {
    const user = renderForm();
    const long = typed(129);
    await user.click(screen.getByPlaceholderText('new password'));
    await user.paste(long);
    await user.click(screen.getByPlaceholderText('confirm new password'));
    await user.paste(long);
    await user.click(screen.getByRole('button', { name: 'Set new password' }));
    expect(await screen.findByText('Maximum 128 characters')).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('refuses a confirmation that does not match', async () => {
    const user = renderForm();
    await fill(user, typed(10), 'm'.repeat(10));
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('accepts exactly ten characters, confirms and sends the person to sign in', async () => {
    resetPassword.mockResolvedValue({ data: { resetPassword: true } });
    const user = renderForm();
    await fill(user, typed(10), typed(10));
    expect(await screen.findByText('sign-in page')).toBeInTheDocument();
    expect(screen.getByText(PASSWORD_RESET_MESSAGE)).toBeInTheDocument();
    expect(resetPassword).toHaveBeenCalledWith({
      variables: { token: LINK_TOKEN, newPassword: typed(10) },
    });
  });

  it('shows the server reason when the link is refused', async () => {
    resetPassword.mockImplementation(async () => {
      throw new Error('This reset link has expired');
    });
    const user = renderForm();
    await fill(user, typed(12), typed(12));
    expect(await screen.findByRole('alert')).toHaveTextContent('This reset link has expired');
    expect(screen.queryByText('sign-in page')).toBeNull();
  });

  it('shows a generic reason for a non-Error failure, cleared on the next attempt', async () => {
    resetPassword.mockImplementationOnce(() => Promise.reject('offline'));
    const user = renderForm();
    await fill(user, typed(12), typed(12));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reset the password');
    resetPassword.mockResolvedValueOnce({ data: { resetPassword: true } });
    await user.click(screen.getByRole('button', { name: 'Set new password' }));
    expect(await screen.findByText('sign-in page')).toBeInTheDocument();
  });
});
