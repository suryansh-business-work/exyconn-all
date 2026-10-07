import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { tokenStore } from '@exyconn/shell/auth/tokenStore';
import { userStore } from '@exyconn/shell/auth/userStore';
import { clearSession, makeSessionToken, makeUser, renderWithProviders } from '../../../test-utils';

const login = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useLoginMutation: () => [login],
}));

const { LoginForm } = await import('../../../../../src/Login/forms/login');

const EMAIL = 'asha@example.com';
const secret = () => 'p'.repeat(8);
const landing = (
  <>
    <Route path="/dashboard" element={<p>dashboard</p>} />
    <Route path="/" element={<p>portal home</p>} />
  </>
);

async function submit(route = '/login') {
  const user = userEvent.setup();
  renderWithProviders(<LoginForm accentColor="#1a237e" />, { route, routes: landing });
  await user.type(screen.getByPlaceholderText('e-mail address'), `  ${EMAIL} `);
  await user.type(screen.getByPlaceholderText('password'), secret());
  await user.click(screen.getByRole('button', { name: 'Log in' }));
  return user;
}

describe('LoginForm submit', () => {
  beforeEach(() => {
    login.mockReset();
  });
  afterEach(clearSession);

  it('signs in with the trimmed email and returns to the page that was asked for', async () => {
    const token = makeSessionToken();
    const signedIn = makeUser();
    login.mockResolvedValue({ data: { login: { token, user: signedIn, mfaRequired: false } } });
    await submit('/login?next=/dashboard');
    expect(await screen.findByText('dashboard')).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith({ variables: { email: EMAIL, password: secret() } });
    expect(tokenStore.get()).toBe(token);
    expect(userStore.get()).toEqual(signedIn);
  });

  it('lands on the portal home when next points off-site', async () => {
    login.mockResolvedValue({ data: { login: { token: makeSessionToken(), user: makeUser() } } });
    await submit('/login?next=//evil.example');
    expect(await screen.findByText('portal home')).toBeInTheDocument();
  });

  it('asks for the authenticator code when the account has two-factor on, and can start over', async () => {
    login.mockResolvedValue({ data: { login: { mfaRequired: true, mfaChallenge: 'ch-1' } } });
    const user = await submit();
    expect(await screen.findByRole('button', { name: 'Verify' })).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Start again' }));
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('shows the server message when sign-in fails', async () => {
    login.mockImplementation(async () => {
      throw new Error('Invalid email or password');
    });
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(tokenStore.get()).toBeNull();
  });

  it('shows a generic message when the failure is not an Error', async () => {
    login.mockImplementation(() => Promise.reject('network down'));
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Login failed');
  });

  it('stays put without a session when the answer carries no token or user', async () => {
    login.mockResolvedValueOnce({ data: null });
    const user = await submit();
    await vi.waitFor(() => expect(login).toHaveBeenCalledTimes(1));
    login.mockResolvedValueOnce({ data: { login: { token: makeSessionToken(), user: null } } });
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await vi.waitFor(() => expect(login).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
    expect(screen.queryByText('dashboard')).toBeNull();
  });

  it('clears an earlier error when the form is sent again', async () => {
    login.mockRejectedValueOnce(new Error('Invalid email or password'));
    const user = await submit();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    login.mockResolvedValueOnce({ data: { login: null } });
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await vi.waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
