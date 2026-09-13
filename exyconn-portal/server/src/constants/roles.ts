/**
 * Single source of truth for role identifiers shared across modules.
 * Consolidated model: Bugs is covered by PROJECTS and Clients by ADMIN, so there
 * is no standalone BUGS/CLIENTS role. SUPPORT owns the support-ticket console.
 */
export const ROLES = {
  /**
   * The platform above the companies: creates organizations and appoints their first
   * administrator. Not a company role — a super admin administers the tenancy, not one
   * company's data, and ADMIN below is the administrator OF a company.
   */
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  FINANCE: 'FINANCE',
  SUPPORT: 'SUPPORT',
  CRM: 'CRM',
  PRODUCTS: 'PRODUCTS',
  LEGAL: 'LEGAL',
  HR: 'HR',
  MARKETING: 'MARKETING',
  PROJECTS: 'PROJECTS',
  AI: 'AI',
  WEBSITE: 'WEBSITE',
  TRACKER: 'TRACKER',
  TECH: 'TECH',
  IT: 'IT',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = Object.values(ROLES);

/** The roles a company can grant. The platform's own role is never one of them. */
export const ORGANIZATION_ROLES: Role[] = ALL_ROLES.filter((role) => role !== ROLES.SUPER_ADMIN);
