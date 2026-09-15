import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Which organization the work in hand belongs to.
 *
 * Every query and every write goes through this (see tenant-plugin.ts): a tenant scope is
 * confined to one organization, a platform scope deliberately spans all of them (creating an
 * organization, the sign-in lookup, the platform's own console). There is no third state —
 * code that runs with no scope at all is refused rather than quietly reading every company's
 * data, which is the failure this whole mechanism exists to prevent.
 */
export interface TenantScope {
  /** The organization the work belongs to; null in a platform scope. */
  organizationId: string | null;
  /** True when the caller deliberately works across organizations. */
  platform: boolean;
}

/** Thrown when data is touched with no organization decided. */
export class TenantScopeError extends Error {
  constructor(what: string) {
    super(
      `${what} was reached with no organization in scope. Wrap the call in runForOrganization() ` +
        'or runAsPlatform(), or set the scope from the request (see middleware/tenant.ts).',
    );
    this.name = 'TenantScopeError';
  }
}

const storage = new AsyncLocalStorage<TenantScope>();

/**
 * Used when nothing else is in scope. Null in the server, so a missing scope is an error.
 * Tests and one-off scripts set it once instead of wrapping every call (see setDefaultScope).
 */
let defaultScope: TenantScope | null = null;

export function currentScope(): TenantScope | null {
  return storage.getStore() ?? defaultScope;
}

/** The scope, or a refusal. Everything that reads or writes data goes through this. */
export function requireScope(what: string): TenantScope {
  const scope = currentScope();
  if (scope === null) {
    throw new TenantScopeError(what);
  }
  return scope;
}

/** The organization in scope, or null in a platform scope. */
export function currentOrganizationId(): string | null {
  return currentScope()?.organizationId ?? null;
}

/** Opens a scope around a synchronous call — the request middleware, which wraps `next()`. */
export function runInScope<T>(scope: TenantScope, fn: () => T): T {
  return storage.run(scope, fn);
}

/**
 * Runs `fn` inside a scope and AWAITS it there.
 *
 * The await is the point. A Mongoose query does nothing until it is awaited, so a scope that
 * merely returned the query would have closed by the time the database saw it — and the query
 * would run with whatever scope the caller happened to be in. Awaiting inside keeps the two
 * together, which makes `() => Model.find()` as safe as `async () => await Model.find()`.
 */
async function runAwaited<T>(scope: TenantScope, fn: () => T | Promise<T>): Promise<T> {
  return storage.run(scope, async () => await fn());
}

/** Runs `fn` confined to one organization — a request, or one turn of a scheduled job. */
export function runForOrganization<T>(
  organizationId: string,
  fn: () => T | Promise<T>,
): Promise<T> {
  return runAwaited({ organizationId, platform: false }, fn);
}

/**
 * Runs `fn` as a person found by a platform-wide lookup (sign-in, a password reset): inside
 * their company, or as the platform for an account that belongs to none (a platform admin).
 */
export function runForOrganizationOf<T>(
  organizationId: string | null,
  fn: () => T | Promise<T>,
): Promise<T> {
  if (organizationId === null) {
    return runAsPlatform(fn);
  }
  return runForOrganization(organizationId, fn);
}

/**
 * Runs `fn` across every organization: the platform console, the sign-in lookup, boot-time
 * seeding, migrations. Deliberately loud in a review — nothing inside is tenant-isolated.
 */
export function runAsPlatform<T>(fn: () => T | Promise<T>): Promise<T> {
  return runAwaited({ organizationId: null, platform: true }, fn);
}

/**
 * Points the CURRENT scope at an organization, once the request knows who is calling.
 * The request middleware opens the scope; the context resolves the caller and sets it here.
 */
export function setScopeOrganization(organizationId: string | null, platform = false): void {
  const scope = storage.getStore();
  if (scope === undefined) {
    // Nothing opened a scope around this call — a context built directly rather than by the
    // request middleware (an internal caller, a test). Open one for the rest of this
    // execution, so what follows is confined exactly as a request would be.
    storage.enterWith({ organizationId, platform });
    return;
  }
  scope.organizationId = organizationId;
  scope.platform = platform;
}

/**
 * The scope to assume when no call has opened one. For tests and CLI scripts, which have no
 * request to inherit from; the server itself never sets this, so a missed scope is an error.
 */
export function setDefaultScope(scope: TenantScope | null): void {
  defaultScope = scope;
}
