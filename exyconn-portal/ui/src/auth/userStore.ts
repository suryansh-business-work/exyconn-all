import { env } from '../config/env';
import type { AuthUser } from './AuthContext';

/** Persists the authenticated user in localStorage so a page refresh can
 *  rehydrate the session instantly without waiting on the network (singleton). */
class UserStore {
  get(): AuthUser | null {
    const raw = localStorage.getItem(env.userStorageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  set(user: AuthUser): void {
    localStorage.setItem(env.userStorageKey, JSON.stringify(user));
  }

  clear(): void {
    localStorage.removeItem(env.userStorageKey);
  }
}

export const userStore = new UserStore();
