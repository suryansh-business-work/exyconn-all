import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { AuthUser } from '@exyconn/shell/auth/AuthContext';
import { ROLES, type Role } from '@exyconn/shell/auth/roles';
import { AdminPage } from '../../../src/admin';
import { renderWithProviders } from '../test-utils';

const auth = vi.hoisted(() => ({
  value: { user: null as AuthUser | null, loading: false },
}));

vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => auth.value }));
vi.mock('../../../src/admin/shell/AdminShell', () => ({
  AdminShell: ({ user }: Readonly<{ user: AuthUser }>) => <p>{`Admin shell for ${user.name}`}</p>,
}));

const user = (roles: Role[]): AuthUser => ({
  id: 'u-1',
  name: 'Meera',
  email: 'meera@example.com',
  roles,
});

beforeEach(() => {
  auth.value = { user: null, loading: false };
});

describe('AdminPage', () => {
  it('waits while the sign-in is being checked', () => {
    auth.value = { user: null, loading: true };
    renderWithProviders(<AdminPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/Admin shell/)).not.toBeInTheDocument();
  });

  it('refuses someone who is not signed in', () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByRole('heading', { name: 'Admins only' })).toBeInTheDocument();
  });

  it('refuses an employee without the admin role', () => {
    auth.value = { user: user([ROLES.EMPLOYEE]), loading: false };
    renderWithProviders(<AdminPage />);
    expect(screen.getByRole('heading', { name: 'Admins only' })).toBeInTheDocument();
  });

  it.each([[ROLES.ADMIN], [ROLES.SUPER_ADMIN]])('lets a %s into the admin shell', (role) => {
    auth.value = { user: user([role]), loading: false };
    renderWithProviders(<AdminPage />);
    expect(screen.getByText('Admin shell for Meera')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Admins only' })).not.toBeInTheDocument();
  });
});
