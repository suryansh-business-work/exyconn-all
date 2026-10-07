import type { NextFunction, Request, Response } from 'express';
import { tenantScope } from '../../../src/middleware/tenant';
import { currentScope, type TenantScope } from '../../../src/lib/tenant';

describe('tenantScope', () => {
  it('runs the rest of the request inside a fresh, empty company scope', () => {
    let seen: TenantScope | null = null;
    const next: NextFunction = () => {
      seen = { ...(currentScope() as TenantScope) };
    };
    tenantScope()({} as Request, {} as Response, next);
    expect(seen).toEqual({ organizationId: null, platform: false });
  });

  it('gives every request its own scope', () => {
    const scopes: Array<TenantScope | null> = [];
    const middleware = tenantScope();
    const capture: NextFunction = () => {
      scopes.push(currentScope());
    };
    middleware({} as Request, {} as Response, capture);
    middleware({} as Request, {} as Response, capture);
    expect(scopes[0]).not.toBe(scopes[1]);
    expect(currentScope()).toEqual({ organizationId: null, platform: true });
  });
});
