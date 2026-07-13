/** Immutable client environment configuration (singleton). */
export const env = Object.freeze({
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:1002/graphql',
  /** Full wordmark for light backgrounds (dark "exyconn" text). */
  logoUrl: '/exyconn-logo.svg',
  /** Full wordmark for dark backgrounds (white "exyconn" text). */
  logoDarkUrl: '/exyconn-logo-dark.svg',
  /** Icon-only mark (no text) for favicon and the post-login sidebar. */
  iconUrl: '/exyconn-icon.svg',
  brandUrl: 'https://exyconn.com/',
  loginVideoUrl: 'https://www.pexels.com/download/video/27152555/',
  tokenStorageKey: 'exyconn-track.token',
  userStorageKey: 'exyconn-track.user',
});
