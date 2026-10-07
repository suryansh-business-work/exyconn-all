import { describe, expect, it } from 'vitest';
import { ROLES } from '@/auth/roles';
import { MODULES, type ModuleDefinition } from '@/config/modules';
import { moduleNavTree, navModules, navPaths, navTree } from '@/layout/PortalLayout/moduleNav';

const hr = MODULES.find((m) => m.key === 'hr')!;

/** A module with no pages of its own: the sidebar should offer the module itself. */
const solo: ModuleDefinition = {
  ...hr,
  key: 'ai',
  label: 'Solo',
  path: '/solo',
  description: 'One page only',
  children: undefined,
};

const adminPages = (roles: Parameters<typeof navModules>[0]) =>
  navModules(roles, 'admin')[0].children?.map((child) => child.key) ?? [];

describe('a module with no pages', () => {
  it('is drawn by its own app as one page: itself, searchable by its description', () => {
    const [leaf, ...rest] = moduleNavTree(solo);

    expect(rest).toEqual([]);
    expect(leaf).toMatchObject({
      key: 'ai',
      label: 'Solo',
      path: '/solo',
      app: 'ai',
      accent: hr.accent,
      keywords: 'One page only',
      children: [],
    });
  });

  it('treats an empty page list the same as none', () => {
    expect(navPaths(moduleNavTree({ ...solo, children: [] }))).toEqual(['/solo']);
  });

  it('is a page, not a branch, in the hub too', () => {
    const [leaf] = navTree([solo], true);

    expect(leaf.children).toEqual([]);
    expect(navPaths(navTree([solo], true))).toEqual(['/solo']);
  });
});

describe('pages that need a role beyond their module’s', () => {
  it('stay hidden from a company administrator', () => {
    expect(adminPages([ROLES.ADMIN])).not.toContain('admin-organizations');
    expect(adminPages([ROLES.ADMIN])).toContain('admin-users');
  });

  it('are shown to a platform administrator', () => {
    expect(adminPages([ROLES.ADMIN, ROLES.SUPER_ADMIN])).toContain('admin-organizations');
  });
});
