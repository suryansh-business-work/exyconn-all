import Constants from 'expo-constants';

/**
 * The portal's GraphQL endpoint, baked in at build time by app.config.ts (production unless CI
 * sets PORTAL_GRAPHQL_URL). An installed app has no environment of its own to read, so this is
 * the one place the address comes from — and a build without it is a broken build.
 */
function portalUrl(): string {
  const url: unknown = Constants.expoConfig?.extra?.portalGraphqlUrl;
  if (typeof url !== 'string' || url === '') {
    throw new Error('This build has no portal address (extra.portalGraphqlUrl).');
  }
  return url;
}

export const PORTAL_GRAPHQL_URL = portalUrl();

/** The scheme capture notifications deep-link through (app.config.ts `scheme`). */
export const APP_SCHEME = 'exyconntracker';
