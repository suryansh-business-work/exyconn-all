import { env } from '../config/env';

/** Persists the JWT in localStorage (singleton). */
class TokenStore {
  get(): string | null {
    return localStorage.getItem(env.tokenStorageKey);
  }

  set(token: string): void {
    localStorage.setItem(env.tokenStorageKey, token);
  }

  clear(): void {
    localStorage.removeItem(env.tokenStorageKey);
  }
}

export const tokenStore = new TokenStore();
