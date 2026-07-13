import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useApolloClient } from '@apollo/client';
import { useMeLazyQuery } from '../graphql/generated';
import { tokenStore } from './tokenStore';
import { userStore } from './userStore';
import type { Role } from './roles';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  avatarUrl?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Rehydrate synchronously from localStorage so a refresh keeps the session
  // without a flash of the login screen.
  const [user, setUser] = useState<AuthUser | null>(() => userStore.get());
  const [loading, setLoading] = useState<boolean>(
    () => Boolean(tokenStore.get()) && !userStore.get(),
  );
  const client = useApolloClient();
  const [fetchMe] = useMeLazyQuery({ fetchPolicy: 'network-only' });

  const persistUser = useCallback((next: AuthUser) => {
    setUser(next);
    userStore.set(next);
  }, []);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    userStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) {
      clearSession();
      setLoading(false);
      return;
    }
    // Revalidate in the background; the cached user already renders the app.
    fetchMe()
      .then(({ data }) => {
        if (data?.me) persistUser(data.me as AuthUser);
        else if (!tokenStore.get()) clearSession(); // token rejected as unauthenticated
      })
      // Transient/network error — keep the cached session instead of logging out.
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [fetchMe, persistUser, clearSession]);

  const signIn = useCallback(
    (token: string, nextUser: AuthUser) => {
      tokenStore.set(token);
      persistUser(nextUser);
    },
    [persistUser],
  );

  const signOut = useCallback(() => {
    clearSession();
    void client.clearStore();
  }, [client, clearSession]);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      userStore.set(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, updateUser }),
    [user, loading, signIn, signOut, updateUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
