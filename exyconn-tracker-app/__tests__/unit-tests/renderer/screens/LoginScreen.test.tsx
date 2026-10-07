// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { LoginResult } from '@shared/types';
import LoginScreen from '../../../../src/renderer/screens/LoginScreen';
import {
  buttonNamed,
  cleanup,
  deferred,
  finish,
  installDomShims,
  mount,
  overrideTracker,
  settle,
  trackerState,
  typeInto,
} from '../../test-utils';

beforeAll(installDomShims);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Built at run time: no credential sits in the source. */
const credential = `pw-${Date.now()}`;

async function open(signedOutReason: string | null = null, rememberMe = false): Promise<void> {
  await mount(
    <LoginScreen
      branding={null}
      rememberMe={rememberMe}
      signedOutReason={signedOutReason}
      themeMode="light"
    />,
    trackerState('signed-out'),
  );
}

function input(selector: string): HTMLInputElement {
  const found = document.querySelector<HTMLInputElement>(selector);
  if (found === null) {
    throw new Error(`No input ${selector}`);
  }
  return found;
}

const email = (): HTMLInputElement => input('input[type="email"]');
const password = (): HTMLInputElement => input('input[autocomplete="current-password"]');

async function fillAndSubmit(address: string, secret: string): Promise<void> {
  await typeInto(email(), address);
  await typeInto(password(), secret);
  await act(async () => buttonNamed('Sign in').click());
}

function alertText(): string {
  return document.querySelector('.MuiAlert-colorError')?.textContent ?? '';
}

describe('LoginScreen', () => {
  it('asks for both fields before it asks the portal', async () => {
    await open();
    const login = vi.fn(() => Promise.resolve<LoginResult>({ ok: true }));
    overrideTracker({ login });
    await act(async () => buttonNamed('Sign in').click());
    expect(document.body.textContent).toContain('Enter your email.');
    expect(document.body.textContent).toContain('Enter your password.');
    expect(login).not.toHaveBeenCalled();

    await fillAndSubmit('   ', credential);
    expect(document.body.textContent).toContain('Enter your email.');
    expect(document.body.textContent).not.toContain('Enter your password.');
    expect(login).not.toHaveBeenCalled();
  });

  it('signs in with the trimmed email and the remember choice, locked meanwhile', async () => {
    await open();
    const answer = deferred<LoginResult>();
    const login = vi.fn((_email: string, _secret: string, _remember: boolean) => answer.promise);
    overrideTracker({ login });
    await act(async () => input('input[type="checkbox"]').click());
    await fillAndSubmit('  asha@example.com ', credential);
    expect(login).toHaveBeenCalledWith('asha@example.com', credential, true);
    expect(buttonNamed('Signing in…').disabled).toBe(true);
    expect(email().disabled).toBe(true);
    expect(password().disabled).toBe(true);

    // Success unmounts this screen from above; until then it stays locked.
    await finish(() => answer.resolve({ ok: true }));
    expect(buttonNamed('Signing in…').disabled).toBe(true);
    expect(alertText()).toBe('');
  });

  it('shows the portal’s own reason for a refusal and unlocks the form', async () => {
    await open(null, true);
    const login = vi.fn((_email: string, _secret: string, _remember: boolean) =>
      Promise.resolve<LoginResult>({ ok: false, error: 'Your account is locked.' }),
    );
    overrideTracker({ login });
    await fillAndSubmit('asha@example.com', credential);
    await settle();
    expect(login).toHaveBeenCalledWith('asha@example.com', credential, true);
    expect(alertText()).toBe('Your account is locked.');
    expect(buttonNamed('Sign in').disabled).toBe(false);
  });

  it('says sign-in failed when the portal refuses without a reason', async () => {
    await open();
    overrideTracker({ login: () => Promise.resolve<LoginResult>({ ok: false }) });
    await fillAndSubmit('asha@example.com', credential);
    await settle();
    expect(alertText()).toBe('Sign in failed. Please check your details and try again.');
  });

  it('logs and explains a request that never reached the portal', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await open();
    overrideTracker({ login: () => Promise.reject(new Error('IPC down')) });
    await fillAndSubmit('asha@example.com', credential);
    await settle();
    expect(alertText()).toBe('Something went wrong. Please try again.');
    expect(log).toHaveBeenCalledWith('Login request failed', expect.any(Error));
    expect(email().disabled).toBe(false);
  });

  it('tells an employee the app signed out why it did', async () => {
    await open('Your session expired. Sign in again.');
    expect(document.querySelector('.MuiAlert-colorWarning')?.textContent).toBe(
      'Your session expired. Sign in again.',
    );
  });

  it('has no warning when the employee signed out themselves', async () => {
    await open();
    expect(document.querySelector('.MuiAlert-colorWarning')).toBeNull();
    expect(document.querySelector('h1')?.textContent).toBe('Sign in');
  });
});
