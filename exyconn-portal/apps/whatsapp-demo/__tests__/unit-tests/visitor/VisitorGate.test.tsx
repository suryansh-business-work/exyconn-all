import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { ROLES, type Role } from '@exyconn/shell/auth/roles';
import { HUB_URL } from '@exyconn/shell/config/apps';
import { VisitorGate } from '../../../src/visitor/VisitorGate';
import { renderWithProviders, useCurrentUrl } from '../test-utils';

const gate = vi.hoisted(() => ({
  auth: { user: null as null | { roles: Role[] }, loading: false },
  visitor: { visitor: null as null | { id: string }, loading: false },
}));

vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => gate.auth }));
vi.mock('../../../src/visitor/useVisitor', () => ({ useVisitor: () => gate.visitor }));
vi.mock('@exyconn/shell/routes/ExternalRedirect', () => ({
  ExternalRedirect: ({ to }: Readonly<{ to: string }>) => <p>{`Leaving for ${to}`}</p>,
}));

function Url() {
  return <p>{`At ${useCurrentUrl()}`}</p>;
}

function renderGate() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<Url />} />
      <Route
        path="*"
        element={
          <VisitorGate>
            <p>The chats</p>
          </VisitorGate>
        }
      />
    </Routes>,
    { route: '/whatsapp-demo/clinic?ref=site' },
  );
}

beforeEach(() => {
  gate.auth = { user: null, loading: false };
  gate.visitor = { visitor: null, loading: false };
});

describe('VisitorGate', () => {
  it.each([
    [true, false],
    [false, true],
  ])('waits while the sign-in (%s) or the visitor pass (%s) is checked', (authLoading, loading) => {
    gate.auth = { user: null, loading: authLoading };
    gate.visitor = { visitor: null, loading };
    renderGate();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('The chats')).not.toBeInTheDocument();
  });

  it('opens the chats for an employee signed in to the portal', () => {
    gate.auth = { user: { roles: [ROLES.EMPLOYEE] }, loading: false };
    renderGate();
    expect(screen.getByText('The chats')).toBeInTheDocument();
  });

  it('sends a portal user without employee access to the hub', () => {
    gate.auth = { user: { roles: [] }, loading: false };
    renderGate();
    expect(screen.getByText(`Leaving for ${HUB_URL}`)).toBeInTheDocument();
    expect(screen.queryByText('The chats')).not.toBeInTheDocument();
  });

  it('opens the chats for a demo visitor', () => {
    gate.visitor = { visitor: { id: 'v-1' }, loading: false };
    renderGate();
    expect(screen.getByText('The chats')).toBeInTheDocument();
  });

  it('sends anyone else to sign in, coming back to where they were', () => {
    renderGate();
    expect(
      screen.getByText(`At /login?next=${encodeURIComponent('/whatsapp-demo/clinic?ref=site')}`),
    ).toBeInTheDocument();
  });
});
