import { screen } from '@testing-library/react';
import { Route, useLocation } from 'react-router-dom';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { clearSession, makeUser, renderWithProviders } from './test-utils';

function Where() {
  const { user } = useAuth();
  return (
    <p>
      {useLocation().pathname} {user?.name ?? 'signed out'}
    </p>
  );
}

afterEach(clearSession);

it('opens on the requested route, signed out by default', () => {
  renderWithProviders(<Where />, { route: '/reset-password' });
  expect(screen.getByText('/reset-password signed out')).toBeInTheDocument();
});

it('starts signed in when a user is seeded and renders extra routes', () => {
  renderWithProviders(<Where />, {
    route: '/dashboard',
    user: makeUser({ name: 'Ravi' }),
    routes: <Route path="/dashboard" element={<p>dashboard</p>} />,
  });
  expect(screen.getByText('dashboard')).toBeInTheDocument();
});
