import { vi } from 'vitest';
import type { AuthUser, useAuth } from '@exyconn/shell/auth/AuthContext';

/** A complete `useAuth()` value for the given signed-in user (or none). */
export function authValue(user: AuthUser | null): ReturnType<typeof useAuth> {
  return { user, loading: false, signIn: vi.fn(), signOut: vi.fn(), updateUser: vi.fn() };
}
