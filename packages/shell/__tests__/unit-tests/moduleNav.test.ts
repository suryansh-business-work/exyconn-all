import { describe, it, expect } from 'vitest';
import { navModules, moduleNavItems } from '../../src/layout/PortalLayout/moduleNav';
import { MODULES } from '../../src/config/modules';
import { ROLES } from '../../src/auth/roles';

const moduleFor = (key: string) => MODULES.find((m) => m.key === key)!;

describe('navModules', () => {
  it('gives the hub every module the roles can open', () => {
    expect(navModules([ROLES.ADMIN], 'hub')).toHaveLength(MODULES.length);
    expect(navModules([ROLES.HR], 'hub').map((m) => m.key)).toEqual(['hr']);
  });

  it('gives a module app only its own module', () => {
    expect(navModules([ROLES.ADMIN], 'hr').map((m) => m.key)).toEqual(['hr']);
    expect(navModules([ROLES.ADMIN], 'finance').map((m) => m.key)).toEqual(['finance']);
  });

  it('yields nothing when the roles cannot open this app', () => {
    expect(navModules([ROLES.HR], 'finance')).toEqual([]);
  });
});

describe('moduleNavItems', () => {
  it('lists a module’s children when it has them', () => {
    const hr = moduleFor('hr');
    const items = moduleNavItems(hr);
    expect(items).toHaveLength(hr.children!.length);
    expect(items.map((i) => i.path)).toEqual(hr.children!.map((c) => c.path));
  });

  it('falls back to the module itself when it has no children', () => {
    const childless = MODULES.find((m) => !m.children?.length);
    if (!childless) return;
    expect(moduleNavItems(childless)).toEqual([
      {
        key: childless.key,
        label: childless.label,
        path: childless.path,
        icon: childless.icon,
      },
    ]);
  });

  it('filters by label, case-insensitively', () => {
    const hr = moduleFor('hr');
    const items = moduleNavItems(hr, 'LEAVE');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => /leave/i.test(i.label))).toBe(true);
    expect(moduleNavItems(hr, 'zzzznope')).toEqual([]);
  });

  it('every module produces at least one nav entry', () => {
    for (const module of MODULES) {
      expect(moduleNavItems(module).length).toBeGreaterThan(0);
    }
  });
});
