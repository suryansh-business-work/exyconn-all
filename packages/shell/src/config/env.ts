import type { PortalAppKey } from './apps';

/** The shell's public files are served under the app's own base path (Vite's `base`). */
const PUBLIC = import.meta.env.BASE_URL;

/** Immutable client environment configuration (singleton). */
export const env = Object.freeze({
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:1002/graphql',
  /** Which micro-frontend this bundle is; every app sets it at build time. */
  portalApp: (import.meta.env.VITE_PORTAL_APP ?? 'hub') as PortalAppKey,
  /** Parent domain shared by every portal app. Empty in dev (localhost ports). */
  portalDomain: import.meta.env.VITE_PORTAL_DOMAIN ?? '',
  /** Full wordmark for light backgrounds (dark "exyconn" text). */
  logoUrl: `${PUBLIC}exyconn-logo.svg`,
  /** Full wordmark for dark backgrounds (white "exyconn" text). */
  logoDarkUrl: `${PUBLIC}exyconn-logo-dark.svg`,
  /**
   * The text the fallback wordmarks above spell out — their alternative text (WCAG 2.2
   * SC 1.1.1) whenever a workspace's own business name has not arrived or is not set.
   */
  logoAlt: 'Exyconn',
  /** Icon-only mark (no text) for favicon and the post-login sidebar. */
  iconUrl: `${PUBLIC}exyconn-icon.svg`,
  brandUrl: 'https://exyconn.com/',
  /** The website a CMS preview opens on, overriding the site's own domain (local dev). */
  websiteOrigin: import.meta.env.VITE_WEBSITE_ORIGIN ?? '',
  tokenStorageKey: 'exyconn-track.token',
  userStorageKey: 'exyconn-track.user',
});
