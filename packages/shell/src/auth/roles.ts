/**
 * Role identifiers — mirrors the server `ROLES` enum. Consolidated model: Bugs is
 * covered by PROJECTS, Clients by ADMIN; SUPPORT owns the support-ticket console.
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
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** ADMIN sees everything; otherwise the user must hold the module's role. */
export function canAccess(roles: Role[], moduleRole: Role): boolean {
  return roles.includes(ROLES.ADMIN) || roles.includes(moduleRole);
}
