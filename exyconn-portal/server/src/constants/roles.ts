/**
 * Single source of truth for role identifiers shared across modules.
 * Consolidated model: Bugs is covered by PROJECTS and Clients by ADMIN, so there
 * is no standalone BUGS/CLIENTS role. SUPPORT owns the support-ticket console.
 */
export const ROLES = {
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
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = Object.values(ROLES);
