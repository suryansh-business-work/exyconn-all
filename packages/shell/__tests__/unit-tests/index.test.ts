import { describe, expect, it } from 'vitest';
import * as shell from '@/index';
import { PortalApp } from '@/app/PortalApp';
import { useAuth } from '@/auth/AuthContext';
import { ROLES, canAccess } from '@/auth/roles';
import { env } from '@/config/env';
import { MODULES } from '@/config/modules';

describe('@exyconn/shell entry point', () => {
  it('exposes the same implementations the apps rely on, not copies', () => {
    expect(shell.PortalApp).toBe(PortalApp);
    expect(shell.useAuth).toBe(useAuth);
    expect(shell.canAccess).toBe(canAccess);
    expect(shell.ROLES).toBe(ROLES);
    expect(shell.env).toBe(env);
    expect(shell.MODULES).toBe(MODULES);
  });

  it('exports every routing and URL helper an app imports from the package root', () => {
    const helpers = [
      shell.ProtectedRoute,
      shell.PortalSwitcher,
      shell.ExternalRedirect,
      shell.appOrigin,
      shell.appBaseUrl,
      shell.appUrl,
      shell.accessibleModules,
      shell.moduleUrl,
      shell.appForPath,
    ];
    for (const helper of helpers) {
      expect(typeof helper).toBe('function');
    }
    expect(typeof shell.HUB_URL).toBe('string');
    expect(Object.keys(shell.PORTAL_APPS).length).toBeGreaterThan(0);
  });

  it('answers access questions through the exported helpers', () => {
    expect(shell.canAccess([shell.ROLES.ADMIN], shell.ROLES.HR)).toBe(true);
    expect(shell.accessibleModules([shell.ROLES.HR]).map((module) => module.key)).toContain('hr');
  });
});
