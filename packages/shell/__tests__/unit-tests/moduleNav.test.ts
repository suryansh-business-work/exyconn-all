import { describe, it, expect } from 'vitest';
import {
  navModules,
  moduleNavItems,
  navSections,
  railItems,
} from '../../src/layout/PortalLayout/moduleNav';
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

describe('railItems', () => {
  it('rails one entry per module in the hub, carrying its own accent', () => {
    const modules = navModules([ROLES.ADMIN], 'hub');
    const items = railItems(modules, true);

    expect(items).toHaveLength(modules.length);
    expect(items.map((i) => i.app)).toEqual(modules.map((m) => m.key));
    expect(items.map((i) => i.accent)).toEqual(modules.map((m) => m.accent));
  });

  it('rails a module app’s own pages, all pointing back at that app', () => {
    const modules = navModules([ROLES.ADMIN], 'hr');
    const items = railItems(modules, false);

    expect(items.map((i) => i.path)).toEqual(moduleNavItems(moduleFor('hr')).map((i) => i.path));
    expect(items.every((i) => i.app === 'hr')).toBe(true);
  });
});

describe('navSections', () => {
  it('leads with the ungrouped pages, under no heading', () => {
    const [first] = navSections(moduleFor('hr'));
    expect(first.label).toBe('');
    expect(first.items.map((i) => i.key)).toContain('hr-dashboard');
  });

  it('groups the rest in the order the config declares them', () => {
    const labels = navSections(moduleFor('hr'))
      .map((s) => s.label)
      .filter(Boolean);
    expect(labels).toEqual([
      'People',
      'Hiring & onboarding',
      'Time & attendance',
      'Pay',
      'Growth',
      'Records',
      'Communication',
    ]);
  });

  it('never repeats a section, so a page cannot appear under two headings', () => {
    for (const module of MODULES) {
      const labels = navSections(module).map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it('keeps every page, whatever the grouping', () => {
    for (const module of MODULES) {
      const inSections = navSections(module).flatMap((s) => s.items.map((i) => i.key));
      expect(inSections).toEqual(moduleNavItems(module).map((i) => i.key));
    }
  });

  it('leaves a small module as one plain list with no heading', () => {
    const sections = navSections(moduleFor('social'));
    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBe('');
  });

  it('finds a page by the section it lives in', () => {
    const keys = moduleNavItems(moduleFor('hr'), 'communication').map((i) => i.key);
    expect(keys.toSorted()).toEqual(['hr-announcements', 'hr-notify']);
  });

  it('drops empty sections when a search matches nothing in them', () => {
    const labels = navSections(moduleFor('hr'), 'payslip').map((s) => s.label);
    expect(labels).toEqual(['Pay']);
  });
});
