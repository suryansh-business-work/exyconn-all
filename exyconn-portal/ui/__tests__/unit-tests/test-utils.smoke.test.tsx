import { screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { makeUser, renderWithProviders } from './test-utils';

function Probe() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  return <p>{`${user?.name ?? 'signed out'} at ${pathname}`}</p>;
}

describe('renderWithProviders', () => {
  it('mounts the router at the route and signs the given user in', () => {
    renderWithProviders(<Probe />, { route: '/portal', user: makeUser({ name: 'Ravi Kumar' }) });
    expect(screen.getByText('Ravi Kumar at /portal')).toBeInTheDocument();
  });

  it('mounts the AuthProvider signed out when user is null', () => {
    renderWithProviders(<Probe />, { user: null });
    expect(screen.getByText('signed out at /')).toBeInTheDocument();
  });
});
