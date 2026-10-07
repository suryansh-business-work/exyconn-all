import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { HUB_URL } from '@exyconn/shell/config/apps';
import { DemoLoginPage } from '../../../src/visitor/DemoLoginPage';
import { renderWithProviders, useCurrentUrl } from '../test-utils';

const login = vi.hoisted(() => ({
  user: null as null | { id: string },
  visitor: null as null | { id: string },
  storeVisitorPass: vi.fn(),
  accent: '',
}));

vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => ({ user: login.user }) }));
vi.mock('../../../src/visitor/useVisitor', () => ({
  useVisitor: () => ({ visitor: login.visitor, loading: false }),
}));
vi.mock('../../../src/visitor/visitorPass', () => ({ storeVisitorPass: login.storeVisitorPass }));
vi.mock('@exyconn/login', () => ({
  Login: () => <p>Portal password sign-in</p>,
  LoginShell: ({
    children,
  }: Readonly<{ children: (page: { accentColor: string }) => ReactNode }>) => (
    <main>{children({ accentColor: '#0a7d5a' })}</main>
  ),
}));
vi.mock('../../../src/visitor/forms/demo-sign-in', () => ({
  DemoSignInForm: ({
    accentColor,
    onSignedIn,
  }: Readonly<{ accentColor: string; onSignedIn: (pass: string) => void }>) => {
    login.accent = accentColor;
    return (
      <button type="button" onClick={() => onSignedIn(['pass', 'from', 'code'].join('-'))}>
        Finish sign-in
      </button>
    );
  },
}));

function Url() {
  return <p>{`At ${useCurrentUrl()}`}</p>;
}

function renderPage(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<DemoLoginPage />} />
      <Route path="/reset-password" element={<DemoLoginPage />} />
      <Route path="/unsubscribe" element={<DemoLoginPage />} />
      <Route path="*" element={<Url />} />
    </Routes>,
    { route },
  );
}

beforeEach(() => {
  login.user = null;
  login.visitor = null;
  login.storeVisitorPass.mockReset();
  login.accent = '';
});

describe('DemoLoginPage', () => {
  it.each(['/reset-password', '/unsubscribe'])(
    'answers an emailed %s link as the portal does',
    (route) => {
      renderPage(route);
      expect(screen.getByText('Portal password sign-in')).toBeInTheDocument();
    },
  );

  it('sends a signed-in portal user on to where they were going', () => {
    login.user = { id: 'u-1' };
    renderPage('/login?next=%2Fadmin');
    expect(screen.getByText('At /admin')).toBeInTheDocument();
  });

  it('sends a portal user home when the next address is unsafe', () => {
    login.user = { id: 'u-1' };
    renderPage('/login?next=%2F%2Fevil.example');
    expect(screen.getByText('At /')).toBeInTheDocument();
  });

  it('keeps a signed-in visitor inside the chats', () => {
    login.visitor = { id: 'v-1' };
    renderPage('/login?next=%2Fadmin');
    expect(screen.getByText('At /whatsapp-demo')).toBeInTheDocument();
  });

  it('takes a signed-in visitor back to the chat they asked for', () => {
    login.visitor = { id: 'v-1' };
    renderPage('/login?next=%2Fwhatsapp-demo%2Fclinic');
    expect(screen.getByText('At /whatsapp-demo/clinic')).toBeInTheDocument();
  });

  it('offers the email-and-code sign-in, tinted with the branding, and a way in for staff', () => {
    renderPage('/login');
    expect(screen.getByRole('heading', { name: 'Try the live WhatsApp demo' })).toBeInTheDocument();
    expect(
      screen.getByText('Sign in with your email and a one-time code to chat with every demo bot.'),
    ).toBeInTheDocument();
    expect(login.accent).toBe('#0a7d5a');
    expect(screen.getByRole('link', { name: 'Sign in to the portal' })).toHaveAttribute(
      'href',
      HUB_URL,
    );
  });

  it('keeps the pass and opens the chat once the code is accepted', async () => {
    renderPage('/login?next=%2Fwhatsapp-demo%2Fsalon');
    await userEvent.click(screen.getByRole('button', { name: 'Finish sign-in' }));
    expect(login.storeVisitorPass).toHaveBeenCalledWith('pass-from-code');
    expect(await screen.findByText('At /whatsapp-demo/salon')).toBeInTheDocument();
  });
});
