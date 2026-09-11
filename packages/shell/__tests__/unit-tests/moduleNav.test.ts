import { describe, it, expect } from 'vitest';
import {
  MAX_NAV_DEPTH,
  filterNavTree,
  moduleNavTree,
  navDepth,
  navModules,
  navPaths,
  navTrail,
  navTree,
} from '../../src/layout/PortalLayout/moduleNav';
import { MODULES, type ModuleDefinition } from '../../src/config/modules';
import { ROLES } from '../../src/auth/roles';

const moduleFor = (key: string) => MODULES.find((m) => m.key === key)!;
const hr = moduleFor('hr');

/** HR with one page nested three deep under its People section: four levels in all. */
const deep: ModuleDefinition = {
  ...hr,
  children: [
    {
      key: 'l2',
      label: 'Level two',
      path: '/hr/l2',
      icon: hr.icon,
      group: 'People',
      children: [
        {
          key: 'l3',
          label: 'Level three',
          path: '/hr/l2/l3',
          icon: hr.icon,
          children: [{ key: 'l4', label: 'Level four', path: '/hr/l2/l3/l4', icon: hr.icon }],
        },
      ],
    },
  ],
};

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

describe('moduleNavTree', () => {
  it('leads with the ungrouped pages, then one branch per section in config order', () => {
    const tree = moduleNavTree(hr);
    expect(tree.slice(0, 2).map((n) => n.key)).toEqual(['hr-dashboard', 'hr-reports']);
    expect(tree.filter((n) => n.children.length > 0).map((n) => n.label)).toEqual([
      'People',
      'Hiring & onboarding',
      'Time & attendance',
      'Pay',
      'Growth',
      'Records',
      'Communication',
    ]);
  });

  it('keeps every page exactly once, whatever the grouping', () => {
    for (const module of MODULES) {
      const paths = navPaths(moduleNavTree(module));
      const expected = module.children?.length ? module.children.map((c) => c.path) : [module.path];
      expect(paths.toSorted((a, b) => a.localeCompare(b))).toEqual(
        expected.toSorted((a, b) => a.localeCompare(b)),
      );
    }
  });

  it('leaves a small module as one plain list with no branches', () => {
    expect(moduleNavTree(moduleFor('social')).every((n) => n.children.length === 0)).toBe(true);
  });

  it('falls back to the module itself when it has no children', () => {
    const childless = MODULES.find((m) => !m.children?.length);
    if (!childless) return;
    expect(moduleNavTree(childless).map((n) => n.path)).toEqual([childless.path]);
  });

  it('nests pages below pages', () => {
    expect(navDepth(moduleNavTree(deep))).toBe(4);
    expect(navPaths(moduleNavTree(deep))).toEqual(['/hr/l2/l3/l4']);
  });
});

describe('navTree', () => {
  it('gives the hub one branch per module, carrying its own app and accent', () => {
    const modules = navModules([ROLES.ADMIN], 'hub');
    const tree = navTree(modules, true);

    expect(tree.map((n) => n.app)).toEqual(modules.map((m) => m.key));
    expect(tree.map((n) => n.accent)).toEqual(modules.map((m) => m.accent));
  });

  it('leaves sections out of the hub, so it nests no deeper than a module app', () => {
    expect(navDepth(navTree([deep], true))).toBe(navDepth(navTree([deep], false)));
  });

  it(`never nests any module deeper than ${MAX_NAV_DEPTH} levels`, () => {
    for (const module of MODULES) {
      expect(navDepth(navTree([module], true))).toBeLessThanOrEqual(MAX_NAV_DEPTH);
      expect(navDepth(navTree([module], false))).toBeLessThanOrEqual(MAX_NAV_DEPTH);
    }
  });
});

describe('filterNavTree', () => {
  const tree = moduleNavTree(hr);

  it('keeps only the branches with a match beneath them', () => {
    const filtered = filterNavTree(tree, 'PAYSLIP');
    expect(filtered.map((n) => n.label)).toEqual(['Pay']);
    expect(navPaths(filtered).length).toBeGreaterThan(0);
  });

  it('keeps a whole section when the section itself matches', () => {
    const [section] = filterNavTree(tree, 'communication');
    expect(section.children.map((n) => n.key).toSorted((a, b) => a.localeCompare(b))).toEqual([
      'hr-announcements',
      'hr-notify',
    ]);
  });

  it('finds pages at any depth', () => {
    expect(navPaths(filterNavTree(moduleNavTree(deep), 'level four'))).toEqual(['/hr/l2/l3/l4']);
  });

  it('matches a hub module by its description', () => {
    const [match] = filterNavTree(navTree([hr], true), hr.description);
    expect(match.key).toBe('hr');
  });

  it('returns nothing when nothing matches', () => {
    expect(filterNavTree(tree, 'zzzznope')).toEqual([]);
  });
});

describe('navTrail', () => {
  it('names every branch from the top down to the page', () => {
    expect(navTrail(moduleNavTree(deep), '/hr/l2/l3/l4')).toEqual(['hr:People', 'l2', 'l3', 'l4']);
  });

  it('is empty when no page has the path', () => {
    expect(navTrail(moduleNavTree(hr), undefined)).toEqual([]);
    expect(navTrail(moduleNavTree(hr), '/nowhere')).toEqual([]);
  });
});
