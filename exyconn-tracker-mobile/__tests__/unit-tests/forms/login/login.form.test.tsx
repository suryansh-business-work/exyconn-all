import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type { LoginResult } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm, loginSchema } from '../../../../src/forms/login';
import { tracker } from '../../../../src/tracker/instance';
import { deferred } from '../../hooks/deferred';
import { renderWithProviders } from '../../test-utils';
import { inputOf, typeInto } from '../field';
import { failingOn } from '../unexpected';

vi.mock('../../../../src/tracker/instance', () => ({ tracker: { login: vi.fn() } }));

/** Built at run time: no credential is ever written into the source. */
const PASS = `pw-${globalThis.crypto.randomUUID()}`;

function fillIn(email: string, pass: string): void {
  typeInto('email', email);
  typeInto('password', pass);
}

function signIn(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginForm', () => {
  it('exports the schema it validates with', () => {
    expect(loginSchema.safeParse({ email: '', password: '', rememberMe: false }).success).toBe(
      false,
    );
  });

  it('asks for both fields before anything is sent', async () => {
    renderWithProviders(<LoginForm rememberMe={false} />);
    signIn();
    expect(await screen.findByText('Enter your email.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(tracker.login).not.toHaveBeenCalled();
  });

  it('refuses a malformed email and a short password', async () => {
    renderWithProviders(<LoginForm rememberMe={false} />);
    fillIn('not-an-email', 'abc');
    signIn();
    expect(await screen.findByText('Enter a valid email.')).toBeInTheDocument();
    expect(screen.getByText('Passwords are at least 6 characters.')).toBeInTheDocument();
  });

  it('signs in with the trimmed email and the remembered choice', async () => {
    vi.mocked(tracker.login).mockResolvedValue({ ok: true });
    renderWithProviders(<LoginForm rememberMe />);
    expect(screen.getByRole('checkbox', { name: 'Remember me on this phone' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    fillIn('  asha@example.test ', PASS);
    signIn();
    await waitFor(() =>
      expect(tracker.login).toHaveBeenCalledWith('asha@example.test', PASS, true),
    );
  });

  it('lets the employee opt out of being remembered', async () => {
    vi.mocked(tracker.login).mockResolvedValue({ ok: true });
    renderWithProviders(<LoginForm rememberMe />);
    const remember = screen.getByRole('checkbox', { name: 'Remember me on this phone' });
    fireEvent.click(remember);
    expect(remember).toHaveAttribute('aria-checked', 'false');
    fillIn('asha@example.test', PASS);
    fireEvent.keyDown(inputOf('password'), { key: 'Enter' });
    await waitFor(() =>
      expect(tracker.login).toHaveBeenCalledWith('asha@example.test', PASS, false),
    );
  });

  it("shows the controller's sentence when the portal refuses", async () => {
    vi.mocked(tracker.login).mockResolvedValue({ ok: false, error: 'Invalid email or password.' });
    renderWithProviders(<LoginForm rememberMe={false} />);
    fillIn('asha@example.test', PASS);
    signIn();
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });

  it('falls back to a plain sentence when a refusal gives no reason', async () => {
    vi.mocked(tracker.login).mockResolvedValue({ ok: false });
    renderWithProviders(<LoginForm rememberMe={false} />);
    fillIn('asha@example.test', PASS);
    signIn();
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('shows why the request itself failed, and logs it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('Network request failed');
    vi.mocked(tracker.login).mockRejectedValue(cause);
    renderWithProviders(<LoginForm rememberMe={false} />);
    fillIn('asha@example.test', PASS);
    signIn();
    expect(await screen.findByText('Network request failed')).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith('Login request failed', cause);
  });

  it('says it is signing in, and locks the form, while the request runs', async () => {
    const request = deferred<LoginResult>();
    vi.mocked(tracker.login).mockReturnValue(request.promise);
    renderWithProviders(<LoginForm rememberMe={false} />);
    fillIn('asha@example.test', PASS);
    signIn();
    expect(await screen.findByRole('button', { name: 'Signing in…' })).toBeInTheDocument();
    await act(async () => {
      request.resolve({ ok: true });
      await request.promise;
    });
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows and hides the password on request', () => {
    renderWithProviders(<LoginForm rememberMe={false} />);
    fireEvent.click(screen.getByRole('button', { name: /^Show/ }));
    expect(screen.getByRole('button', { name: /^Hide/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Hide/ }));
    expect(screen.getByRole('button', { name: /^Show/ })).toBeInTheDocument();
  });

  it('logs a failure it did not expect, from either way of signing in', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Translations unavailable');
    vi.mocked(tracker.login).mockResolvedValue({ ok: false });
    renderWithProviders(<LoginForm rememberMe={false} />, {
      onMissing: failingOn('Something went wrong. Please try again.', failure),
    });
    fillIn('asha@example.test', PASS);
    signIn();
    await waitFor(() => expect(error).toHaveBeenCalledWith('Sign in failed', failure));
    error.mockClear();
    fireEvent.keyDown(inputOf('password'), { key: 'Enter' });
    await waitFor(() => expect(error).toHaveBeenCalledWith('Sign in failed', failure));
  });
});
