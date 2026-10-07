import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';

const login = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useLoginMutation: () => [login],
}));

const { LoginForm } = await import('../../../../../src/Login/forms/login');

const passwordInput = () => screen.getByPlaceholderText('password');

describe('LoginForm validation and controls', () => {
  beforeEach(() => {
    login.mockReset();
  });

  it('requires both fields and never calls the API when they are empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm accentColor="#1a237e" />);
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('rejects a malformed email and a password under six characters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm accentColor="#1a237e" />);
    await user.type(screen.getByPlaceholderText('e-mail address'), 'not-an-email');
    await user.type(passwordInput(), 'abc');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Minimum 6 characters')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('validates a field once it has been touched', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm accentColor="#1a237e" />);
    await user.click(screen.getByPlaceholderText('e-mail address'));
    await user.tab();
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });

  it('shows and hides the password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm accentColor="#1a237e" />);
    expect(passwordInput()).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('VisibilityIcon')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'toggle password' }));
    expect(passwordInput()).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('VisibilityOffIcon')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'toggle password' }));
    expect(passwordInput()).toHaveAttribute('type', 'password');
  });

  it('opens the forgot-password dialog and closes it on cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm accentColor="#1a237e" />);
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(await screen.findByRole('dialog', { name: 'Reset your password' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('offers admin recovery and marks itself ready', () => {
    renderWithProviders(<LoginForm accentColor="#1a237e" />);
    expect(
      screen.getByRole('button', { name: 'No admin account? Email admin credentials' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('login-form-ready')).toBeInTheDocument();
  });
});
