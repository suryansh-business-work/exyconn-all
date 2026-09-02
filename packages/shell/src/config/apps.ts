import { env } from './env';

/**
 * Every micro-frontend that makes up the portal. Each one is its own Vite build,
 * served from its own subdomain in production and its own port in local dev, and
 * all of them talk to the single portal GraphQL server.
 */
export const PORTAL_APPS = {
  hub: { subdomain: 'portal', port: 4003 },
  admin: { subdomain: 'admin', port: 4020 },
  employee: { subdomain: 'employee', port: 4021 },
  finance: { subdomain: 'finance', port: 4022 },
  support: { subdomain: 'support', port: 4023 },
  crm: { subdomain: 'crm', port: 4024 },
  products: { subdomain: 'products', port: 4025 },
  legal: { subdomain: 'legal', port: 4026 },
  hr: { subdomain: 'hr', port: 4027 },
  marketing: { subdomain: 'marketing', port: 4028 },
  projects: { subdomain: 'projects', port: 4029 },
  ai: { subdomain: 'ai', port: 4030 },
  website: { subdomain: 'website', port: 4031 },
  tracker: { subdomain: 'tracker', port: 4032 },
} as const;

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
