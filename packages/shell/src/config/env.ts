import type { PortalAppKey } from './apps';

/** Immutable client environment configuration (singleton). */
export const env = Object.freeze({
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:1002/graphql',
  /** Which micro-frontend this bundle is; every app sets it at build time. */
  portalApp: (import.meta.env.VITE_PORTAL_APP ?? 'hub') as PortalAppKey,
  /** Parent domain shared by every portal app. Empty in dev (localhost ports). */
  portalDomain: import.meta.env.VITE_PORTAL_DOMAIN ?? '',
  /** Full wordmark for light backgrounds (dark "exyconn" text). */
  logoUrl: '/exyconn-logo.svg',
  /** Full wordmark for dark backgrounds (white "exyconn" text). */
  logoDarkUrl: '/exyconn-logo-dark.svg',
  /**
   * The text the fallback wordmarks above spell out — their alternative text (WCAG 2.2
   * SC 1.1.1) whenever a workspace's own business name has not arrived or is not set.
   */
  logoAlt: 'Exyconn',
  /** Icon-only mark (no text) for favicon and the post-login sidebar. */
  iconUrl: '/exyconn-icon.svg',
  brandUrl: 'https://exyconn.com/',
  tokenStorageKey: 'exyconn-track.token',
  userStorageKey: 'exyconn-track.user',
});
