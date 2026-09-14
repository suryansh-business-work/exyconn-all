import type { NextFunction, Request, Response } from 'express';
import { runInScope } from '../lib/tenant';

/**
 * Opens an organization scope for the request, which `buildContext` then points at the
 * caller's company (see middleware/auth.ts and lib/tenant).
 *
 * It has to be opened HERE, around the whole request, rather than where the caller is
 * identified: the scope is what every later query reads, and a scope opened inside the
 * context function would already have closed by the time a resolver ran.
 */
export function tenantScope() {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    runInScope({ organizationId: null, platform: false }, next);
  };
}
