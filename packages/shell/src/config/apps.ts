import appsRegistry from '@exyconn/config/apps.json';
import { env } from './env';
import { ORGANIZATION_BASENAME } from './organizationPath';

/**
 * Every micro-frontend that makes up the portal. Each one is its own Vite build,
 * served from its own subdomain in production and its own port in local dev, and
 * all of them talk to the single portal GraphQL server.
 *
 * The registry itself lives in `@exyconn/config/apps.json` so the Vite dev ports,
 * the page `<head>` each app ships and the cross-app links below all read the same
 * source. Adding an app means adding it there.
 */
export const PORTAL_APPS = appsRegistry;

export type PortalAppKey = keyof typeof PORTAL_APPS;

/** Origin an app is served from — subdomain in production, localhost port in dev. */
export function appOrigin(app: PortalAppKey): string {
  const { subdomain, port } = PORTAL_APPS[app];
  if (!env.portalDomain) return `http://localhost:${port}`;
  return `https://${subdomain}.${env.portalDomain}`;
}

/** The path an app is mounted at on its origin (apps.json `basePath`); empty at the root. */
function appBasePath(app: PortalAppKey): string {
  const entry = PORTAL_APPS[app];
  return 'basePath' in entry ? entry.basePath : '';
}

/**
 * Where an app's pages start for the company this page shows: its origin, the path it is
 * mounted at, then the company prefix.
 */
export function appBaseUrl(app: PortalAppKey): string {
  return `${appOrigin(app)}${appBasePath(app)}${ORGANIZATION_BASENAME}`;
}

/**
 * Relative path when the target is this app, absolute URL when it is another one. A path that
 * starts with the target app's base path (a module mounted at `/whatsapp-demo`) is taken inside
 * the app, so the base path is not repeated.
 */
export function appUrl(app: PortalAppKey, path: string): string {
  const base = appBasePath(app);
  const inApp = base && path.startsWith(base) ? path.slice(base.length) || '/' : path;
  return app === env.portalApp ? inApp : `${appBaseUrl(app)}${inApp}`;
}

/** Landing app that hosts the module launcher. */
export const HUB_URL = appBaseUrl('hub');
