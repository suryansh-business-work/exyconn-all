import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { VendorLoginPage } from '../../../src/auth/VendorLoginPage';
import { vendorPass } from '../../../src/auth/vendorPass';
import { renderWithProviders, useCurrentUrl } from '../test-utils';

interface FormProps {
  accentColor: string;
  requestCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<string | undefined>;
  onSignedIn: (pass: string) => void;
}

const signIn = vi.hoisted(() => ({ accent: '#0f766e', form: null as null | FormProps }));
const gql = vi.hoisted(() => ({ request: vi.fn(), verify: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRequestVendorPortalCodeMutation: () => [gql.request],
  useVerifyVendorPortalCodeMutation: () => [gql.verify],
}));

/** The real shell reads branding and the colour mode; the stand-in hands over an accent. */
vi.mock('@exyconn/login', () => ({
  LoginShell: ({
    children,
  }: Readonly<{ children: (page: { accentColor: string }) => ReactNode }>) => (
    <main>{children({ accentColor: signIn.accent })}</main>
  ),
}));

/** The two-step form has its own tests in the shell; here it records the wiring it was given. */
vi.mock('@exyconn/shell/components/form/email-code-sign-in', () => ({
  EmailCodeSignInForm: (props: Readonly<FormProps>) => {
    signIn.form = props;
    return <p>Sign-in form in {props.accentColor}</p>;
  },
}));

function Landed() {
  return <p data-testid="landed">{useCurrentUrl()}</p>;
}

function renderLogin(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<VendorLoginPage />} />
      <Route path="*" element={<Landed />} />
    </Routes>,
    { route },
  );
}

function form(): FormProps {
  if (!signIn.form) throw new Error('The sign-in form was not rendered');
  return signIn.form;
}

describe('VendorLoginPage', () => {
  beforeEach(() => {
    signIn.form = null;
    gql.request.mockResolvedValue({ data: { requestVendorPortalCode: true } });
    gql.verify.mockResolvedValue({
      data: { verifyVendorPortalCode: { token: 'pass-1', name: 'Sam', email: 'sam@paper.test' } },
    });
  });
  afterEach(() => {
    vendorPass.clear();
    vi.clearAllMocks();
  });

  it('introduces the portal and hands the branding accent to the sign-in form', () => {
    renderLogin('/login');
    expect(screen.getByText('Sign in to the vendor portal')).toBeInTheDocument();
    expect(
      screen.getByText('No access yet? Ask your buyer to add your email.'),
    ).toBeInTheDocument();
    expect(screen.getByText(`Sign-in form in ${signIn.accent}`)).toBeInTheDocument();
  });

  it('asks the server to email a code to the address entered', async () => {
    renderLogin('/login');
    await expect(form().requestCode('sam@paper.test')).resolves.toBeUndefined();
    expect(gql.request).toHaveBeenCalledWith({ variables: { email: 'sam@paper.test' } });
  });

  it('checks the code and answers the vendor pass', async () => {
    renderLogin('/login');
    await expect(form().verifyCode('sam@paper.test', '123456')).resolves.toBe('pass-1');
    expect(gql.verify).toHaveBeenCalledWith({
      variables: { email: 'sam@paper.test', code: '123456' },
    });
  });

  it('answers no pass when the server sent no session back', async () => {
    gql.verify.mockResolvedValueOnce({ data: undefined });
    renderLogin('/login');
    await expect(form().verifyCode('sam@paper.test', '123456')).resolves.toBeUndefined();
  });

  it('lets a request failure reach the form, which shows it', async () => {
    gql.request.mockRejectedValueOnce(new Error('No access'));
    renderLogin('/login');
    await expect(form().requestCode('ghost@paper.test')).rejects.toThrow('No access');
  });

  it('keeps the pass and goes where the contact was headed once signed in', async () => {
    renderLogin('/login?next=%2Finvoices%3Fstatus%3DREJECTED');
    act(() => form().onSignedIn('pass-7'));
    expect(await screen.findByTestId('landed')).toHaveTextContent('/invoices?status=REJECTED');
    expect(vendorPass.has()).toBe(true);
  });

  it('lands on the purchase orders when no destination was asked for', async () => {
    renderLogin('/login');
    act(() => form().onSignedIn('pass-8'));
    expect(await screen.findByTestId('landed')).toHaveTextContent(/^\/orders$/);
  });

  it('never follows a destination off the site', async () => {
    renderLogin('/login?next=%2F%2Fevil.example%2Fsteal');
    act(() => form().onSignedIn('pass-9'));
    await waitFor(() => expect(screen.getByTestId('landed')).toHaveTextContent(/^\/orders$/));
  });

  it('skips the sign-in for a contact who already holds a pass', async () => {
    vendorPass.store(`pass-${Date.now()}`);
    renderLogin('/login?next=%2Finvoices');
    expect(await screen.findByTestId('landed')).toHaveTextContent('/invoices');
    expect(screen.queryByText('Sign in to the vendor portal')).not.toBeInTheDocument();
  });
});
