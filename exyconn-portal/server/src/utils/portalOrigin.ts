import { env } from '../config/env';

/**
 * The portal an emailed link should open.
 *
 * Only an origin CORS already trusts is honoured: the header is caller-supplied, and a
 * spoofed one would mail a live token — a password reset, an unsubscribe — to somebody
 * else's domain. Anything else goes to the hub.
 */
export function portalOrigin(origin?: string): string {
  if (origin && env.corsOrigins.includes(origin)) {
    return origin;
  }
  return env.portalHubUrl;
}
