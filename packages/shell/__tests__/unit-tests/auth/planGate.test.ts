import { describe, expect, it } from 'vitest';
import { ROLES } from '@/auth/roles';
import { canAccess, planIncludes } from '@/auth/roles';
import { accessibleModules } from '@/config/modules';
import { navModules } from '@/layout/PortalLayout/moduleNav';
import { moduleItems } from '@/layout/CommandPalette/palette.items';
import { buildPortalEntries } from '@/layout/PortalSwitcher/portalEntries';

/** A company on a plan that opens only the CRM besides Admin and My Workspace. */
const CRM_PLAN = [ROLES.CRM];

describe('planIncludes', () => {
  it('opens every module when the company has no plan limit', () => {
    expect(planIncludes(ROLES.FINANCE, null)).toBe(true);
    expect(planIncludes(ROLES.FINANCE, undefined)).toBe(true);
  });

  it('opens only the plan’s modules, plus Admin, My Workspace and the platform screens', () => {
    expect(planIncludes(ROLES.CRM, CRM_PLAN)).toBe(true);
    expect(planIncludes(ROLES.FINANCE, CRM_PLAN)).toBe(false);
    expect(planIncludes(ROLES.ADMIN, [])).toBe(true);
    expect(planIncludes(ROLES.EMPLOYEE, [])).toBe(true);
    expect(planIncludes(ROLES.SUPER_ADMIN, [])).toBe(true);
  });
});

describe('canAccess within a plan', () => {
  it('stops even an ADMIN at a module the plan leaves out', () => {
    expect(canAccess([ROLES.ADMIN], ROLES.FINANCE, CRM_PLAN)).toBe(false);
    expect(canAccess([ROLES.ADMIN], ROLES.CRM, CRM_PLAN)).toBe(true);
  });

  it('still needs the module role inside the plan', () => {
    expect(canAccess([ROLES.HR], ROLES.CRM, CRM_PLAN)).toBe(false);
    expect(canAccess([ROLES.CRM], ROLES.CRM, CRM_PLAN)).toBe(true);
  });

  it('keeps Admin and My Workspace open on a lapsed plan', () => {
    expect(canAccess([ROLES.ADMIN], ROLES.ADMIN, [])).toBe(true);
    expect(canAccess([ROLES.EMPLOYEE], ROLES.EMPLOYEE, [])).toBe(true);
    expect(canAccess([ROLES.ADMIN], ROLES.CRM, [])).toBe(false);
  });

  it('leaves the platform screens to SUPER_ADMIN whatever the plan', () => {
    expect(canAccess([ROLES.ADMIN], ROLES.SUPER_ADMIN, null)).toBe(false);
    expect(canAccess([ROLES.SUPER_ADMIN], ROLES.SUPER_ADMIN, [])).toBe(true);
  });
});

describe('navigation within a plan', () => {
  it('lists only the modules the plan opens for an ADMIN', () => {
    const keys = accessibleModules([ROLES.ADMIN], CRM_PLAN).map((module) => module.key);

    expect(keys).toEqual(expect.arrayContaining(['admin', 'employee', 'crm']));
    expect(keys).not.toContain('finance');
    expect(keys).not.toContain('hr');
  });

  it('lists every module the roles hold when there is no plan limit', () => {
    const keys = accessibleModules([ROLES.ADMIN]).map((module) => module.key);

    expect(keys).toEqual(expect.arrayContaining(['finance', 'hr', 'crm']));
  });

  it('hides Admin’s platform pages (Plans) from a company administrator but shows Billing', () => {
    const [admin] = navModules([ROLES.ADMIN], 'admin', CRM_PLAN);
    const paths = (admin.children ?? []).map((child) => child.path);

    expect(paths).toContain('/admin/billing');
    expect(paths).not.toContain('/admin/plans');
  });

  it('shows Plans to a platform administrator', () => {
    const [admin] = navModules([ROLES.ADMIN, ROLES.SUPER_ADMIN], 'admin', null);

    expect((admin.children ?? []).map((child) => child.path)).toContain('/admin/plans');
  });

  it('gives a module bundle outside the plan no navigation at all', () => {
    expect(navModules([ROLES.ADMIN], 'finance', CRM_PLAN)).toEqual([]);
  });

  it('offers no palette entry or portal for a module outside the plan', () => {
    expect(moduleItems([ROLES.ADMIN], 'finance', CRM_PLAN)).toEqual([]);
    expect(moduleItems([ROLES.ADMIN], 'crm', CRM_PLAN).map((item) => item.title)).toContain('CRM');

    const portals = buildPortalEntries([ROLES.ADMIN], 'hub', '', CRM_PLAN).map(
      (entry) => entry.key,
    );
    expect(portals).toContain('crm');
    expect(portals).not.toContain('finance');
  });
});
