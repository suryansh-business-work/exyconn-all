import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { ClientLoginPage } from '../../../src/auth/ClientLoginPage';
import { clientPass } from '../../../src/auth/clientPass';
import { renderWithProviders, useCurrentUrl } from '../test-utils';

const signIn = vi.hoisted(() => ({ pass: '', accent: '#0f766e' }));

/** The real shell reads branding and the colour mode; the stand-in hands over an accent. */
vi.mock('@exyconn/login', () => ({
  LoginShell: ({
    children,
  }: Readonly<{ children: (page: { accentColor: string }) => ReactNode }>) => (
    <main>{children({ accentColor: signIn.accent })}</main>
  ),
}));

/** The two-step form has its own tests; here it only reports a finished sign-in. */
vi.mock('../../../src/auth/forms/client-sign-in', () => ({
  ClientSignInForm: ({
    accentColor,
    onSignedIn,
  }: Readonly<{ accentColor: string; onSignedIn: (pass: string) => void }>) => (
    <button type="button" onClick={() => onSignedIn(signIn.pass)}>
      Finish sign-in in {accentColor}
    </button>
  ),
}));

function Landed() {
  return <p data-testid="landed">{useCurrentUrl()}</p>;
}

function renderLogin(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<ClientLoginPage />} />
      <Route path="*" element={<Landed />} />
    </Routes>,
    { route },
  );
}

describe('ClientLoginPage', () => {
  afterEach(() => clientPass.clear());

  it('introduces the hub and hands the branding accent to the sign-in form', () => {
    renderLogin('/login');
    expect(screen.getByText('Sign in to your client hub')).toBeInTheDocument();
    expect(
      screen.getByText('No access yet? Ask your Exyconn account manager to add your email.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Finish sign-in in ${signIn.accent}` }),
    ).toBeInTheDocument();
  });

  it('keeps the pass and goes where the contact was headed once signed in', async () => {
    signIn.pass = `pass-${Date.now()}`;
    renderLogin('/login?next=%2Finvoices%3Fpay%3Dinv-7');
    await userEvent.click(screen.getByRole('button', { name: /Finish sign-in/ }));
    expect(await screen.findByTestId('landed')).toHaveTextContent('/invoices?pay=inv-7');
    expect(clientPass.has()).toBe(true);
  });

  it('lands on the dashboard when no destination was asked for', async () => {
    signIn.pass = `pass-${Date.now()}`;
    renderLogin('/login');
    await userEvent.click(screen.getByRole('button', { name: /Finish sign-in/ }));
    expect(await screen.findByTestId('landed')).toHaveTextContent('/dashboard');
  });

  it('never follows a destination off the site', async () => {
    signIn.pass = `pass-${Date.now()}`;
    renderLogin('/login?next=%2F%2Fevil.example%2Fsteal');
    await userEvent.click(screen.getByRole('button', { name: /Finish sign-in/ }));
    expect(await screen.findByTestId('landed')).toHaveTextContent('/dashboard');
  });

  it('skips the sign-in for a contact who already holds a pass', async () => {
    clientPass.store(`pass-${Date.now()}`);
    renderLogin('/login?next=%2Fsupport');
    expect(await screen.findByTestId('landed')).toHaveTextContent('/support');
    expect(screen.queryByText('Sign in to your client hub')).not.toBeInTheDocument();
  });
});
