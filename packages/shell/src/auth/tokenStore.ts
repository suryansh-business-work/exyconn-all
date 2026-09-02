import { env } from '@/config/env';

/** Matches the server's JWT_EXPIRES_IN (7d) so the cookie dies with the token. */
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** Scopes the cookie to the parent domain so every portal subdomain shares it. */
function cookieScope(): string {
  const { hostname, protocol } = window.location;
  const shared = env.portalDomain && hostname.endsWith(env.portalDomain);
  const domain = shared ? `; domain=.${env.portalDomain}` : '';
  const secure = protocol === 'https:' ? '; secure' : '';
  return `; path=/${domain}; samesite=lax${secure}`;
}

/**
 * Persists the JWT in a cookie scoped to the parent domain (singleton), so a
 * single sign-in covers every micro-frontend on its own subdomain. It stays
 * readable from JS because Apollo sends it as an Authorization header.
 */
class TokenStore {
  get(): string | null {
    const prefix = `${env.tokenStorageKey}=`;
    const hit = document.cookie.split('; ').find((c) => c.startsWith(prefix));
    if (hit) return decodeURIComponent(hit.slice(prefix.length));
    // Carry over a session created before the cookie switch so nobody is signed out.
    const legacy = localStorage.getItem(env.tokenStorageKey);
    if (legacy) this.set(legacy);
    return legacy;
  }

  set(token: string): void {
    localStorage.removeItem(env.tokenStorageKey);
    document.cookie = `${env.tokenStorageKey}=${encodeURIComponent(token)}${cookieScope()}; max-age=${MAX_AGE_SECONDS}`;
  }

  clear(): void {
    localStorage.removeItem(env.tokenStorageKey);
    document.cookie = `${env.tokenStorageKey}=${cookieScope()}; max-age=0`;
  }
}

export const tokenStore = new TokenStore();
