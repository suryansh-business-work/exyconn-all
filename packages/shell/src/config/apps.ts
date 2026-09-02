import appsRegistry from '@exyconn/config/apps.json';
import { env } from './env';

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

/** Relative path when the target is this app, absolute URL when it is another one. */
export function appUrl(app: PortalAppKey, path: string): string {
  return app === env.portalApp ? path : `${appOrigin(app)}${path}`;
}

/** Landing app that hosts the module launcher. */
export const HUB_URL = appOrigin('hub');
