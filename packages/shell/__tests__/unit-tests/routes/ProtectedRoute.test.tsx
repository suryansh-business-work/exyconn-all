import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { ExternalRedirect } from '@/routes/ExternalRedirect';
import { HUB_URL } from '@/config/apps';
import { tokenStore } from '@/auth/tokenStore';
import { makeSessionToken, makeUser, renderWithProviders } from '../test-utils';

function LoginProbe() {
  const location = useLocation();
  return <output data-testid="login">{`${location.pathname}${location.search}`}</output>;
}

function renderGate(user: ReturnType<typeof makeUser> | null, requiredRole?: 'HR') {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginProbe />} />
      <Route
        path="*"
        element={
          <ProtectedRoute requiredRole={requiredRole}>
            <p>Leave requests</p>
          </ProtectedRoute>
        }
      />
    </Routes>,
    { user, route: '/hr/leave?tab=pending' },
  );
}

const replace = vi.fn();

describe('ProtectedRoute', () => {
  beforeEach(() => {
    replace.mockReset();
    vi.stubGlobal('location', { ...globalThis.location, replace });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a signed-out visitor to the login, carrying where they were going', () => {
    renderGate(null);

    expect(screen.getByTestId('login')).toHaveTextContent(
      `/login?next=${encodeURIComponent('/hr/leave?tab=pending')}`,
    );
    expect(screen.queryByText('Leave requests')).not.toBeInTheDocument();
  });

  it('shows the page to a signed-in person when no role is required', () => {
    renderGate(makeUser());

    expect(screen.getByText('Leave requests')).toBeInTheDocument();
  });

  it('lets in the module role and an admin', () => {
    renderGate(makeUser({ roles: ['HR'] }), 'HR');
    expect(screen.getByText('Leave requests')).toBeInTheDocument();
  });

  it('lets in an admin without the module role', () => {
    renderGate(makeUser({ roles: ['ADMIN'] }), 'HR');
    expect(screen.getByText('Leave requests')).toBeInTheDocument();
  });

  it('sends somebody without the module role to the hub instead', () => {
    renderGate(makeUser({ roles: ['EMPLOYEE'] }), 'HR');

    expect(screen.queryByText('Leave requests')).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(HUB_URL);
  });

  it('waits while a stored session is being checked, then decides', async () => {
    // A token with no cached user: the session has to be confirmed before anything shows.
    tokenStore.set(makeSessionToken());
    renderGate(null);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Leave requests')).not.toBeInTheDocument();
    // The Me query has no mock, so it fails; with no cached user there is nobody signed in.
    await waitFor(() => expect(screen.getByTestId('login')).toBeInTheDocument());
  });
});

describe('ExternalRedirect', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('replaces the page with the other origin, and again when the target changes', () => {
    const go = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, replace: go });

    const { rerender, container } = renderWithProviders(
      <ExternalRedirect to="https://hub.test/" />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(go).toHaveBeenLastCalledWith('https://hub.test/');

    rerender(<ExternalRedirect to="https://hr.test/" />);
    expect(go).toHaveBeenLastCalledWith('https://hr.test/');
    expect(go).toHaveBeenCalledTimes(2);
  });
});
