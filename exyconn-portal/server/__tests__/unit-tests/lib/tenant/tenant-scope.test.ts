import {
  TenantScopeError,
  currentOrganizationId,
  currentScope,
  requireScope,
  runAsPlatform,
  runForOrganization,
  runForOrganizationOf,
  runInScope,
  setDefaultScope,
  setScopeOrganization,
  setScopeSelf,
  type TenantScope,
} from '../../../../src/lib/tenant';

const PLATFORM_DEFAULT: TenantScope = { organizationId: null, platform: true };
const tick = () => new Promise((resolve) => setImmediate(resolve));

afterEach(() => setDefaultScope(PLATFORM_DEFAULT));

describe('the default scope', () => {
  it('is what a call with no scope of its own sees', () => {
    expect(currentScope()).toEqual(PLATFORM_DEFAULT);
    expect(currentOrganizationId()).toBeNull();
    expect(requireScope('anything')).toEqual(PLATFORM_DEFAULT);
  });

  it('refuses data access when there is no scope at all', () => {
    setDefaultScope(null);
    expect(currentScope()).toBeNull();
    expect(currentOrganizationId()).toBeNull();
    expect(() => requireScope('Invoice.find()')).toThrow(TenantScopeError);
    expect(() => requireScope('Invoice.find()')).toThrow(
      /^Invoice\.find\(\) was reached with no organization in scope/,
    );
  });

  it('names its error so logs can tell it apart', () => {
    const error = new TenantScopeError('Job');
    expect(error.name).toBe('TenantScopeError');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('runForOrganization()');
  });
});

describe('opening a scope', () => {
  it('runs a synchronous call inside the scope it was given', () => {
    const result = runInScope({ organizationId: 'org-a', platform: false }, () => ({
      id: currentOrganizationId(),
      scope: currentScope(),
    }));
    expect(result).toEqual({ id: 'org-a', scope: { organizationId: 'org-a', platform: false } });
    expect(currentScope()).toEqual(PLATFORM_DEFAULT);
  });

  it('keeps one organization’s scope across awaits', async () => {
    const seen = await runForOrganization('org-b', async () => {
      await tick();
      return currentScope();
    });
    expect(seen).toEqual({ organizationId: 'org-b', platform: false });
  });

  it('awaits a plain value as well as a promise', async () => {
    await expect(runForOrganization('org-c', () => currentOrganizationId())).resolves.toBe('org-c');
  });

  it('runs as the platform for an account with no company, and inside it otherwise', async () => {
    await expect(runForOrganizationOf(null, () => currentScope())).resolves.toEqual({
      organizationId: null,
      platform: true,
    });
    await expect(runForOrganizationOf('org-d', () => currentScope())).resolves.toEqual({
      organizationId: 'org-d',
      platform: false,
    });
    await expect(runAsPlatform(() => currentScope()?.platform)).resolves.toBe(true);
  });
});

describe('pointing the current scope', () => {
  it('re-points the scope the request opened', () => {
    const scope = runInScope({ organizationId: null, platform: false }, () => {
      setScopeOrganization('org-e');
      const first = { ...currentScope() };
      setScopeOrganization(null, true);
      return { first, then: { ...currentScope() } };
    });
    expect(scope.first).toEqual({ organizationId: 'org-e', platform: false });
    expect(scope.then).toEqual({ organizationId: null, platform: true });
  });

  it('opens a scope for the rest of the call when none was opened', async () => {
    const seen = await new Promise<TenantScope | null>((resolve) => {
      setImmediate(() => {
        setScopeOrganization('org-f');
        resolve(currentScope());
      });
    });
    expect(seen).toEqual({ organizationId: 'org-f', platform: false });
    expect(currentScope()).toEqual(PLATFORM_DEFAULT);
  });

  it('lets the scope reach the caller’s own account, and clears it again', () => {
    const self = { userId: 'user-1', organizationId: 'home' };
    const seen = runInScope({ organizationId: 'org-g', platform: false }, () => {
      setScopeSelf(self);
      const reached = currentScope()?.self;
      setScopeSelf(null);
      return { reached, cleared: currentScope()?.self };
    });
    expect(seen).toEqual({ reached: self, cleared: null });
  });

  it('ignores a self with no scope open', async () => {
    const seen = await new Promise<TenantScope | null>((resolve) => {
      setImmediate(() => {
        setScopeSelf({ userId: 'u', organizationId: 'o' });
        resolve(currentScope());
      });
    });
    expect(seen).toEqual(PLATFORM_DEFAULT);
  });
});
