/**
 * Role identifiers — mirrors the server `ROLES` enum. Consolidated model: Bugs is
 * covered by PROJECTS, Clients by ADMIN; SUPPORT owns the support-ticket console.
 */
export const ROLES = {
  /**
   * The platform above the companies: creates organizations and appoints their first
   * administrator. Not a company role — see the server's constants/roles.ts.
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
  /** The management systems: ISO 9001, 27001, 45001 and 14001 in one register. */
  COMPLIANCE: 'COMPLIANCE',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** ADMIN sees everything in their own company; otherwise the user must hold the module's role. */
export function canAccess(roles: Role[], moduleRole: Role): boolean {
  if (moduleRole === ROLES.SUPER_ADMIN) {
    // The platform's own screens: ADMIN is the top of ONE company and never passes here.
    return roles.includes(ROLES.SUPER_ADMIN);
  }
  return roles.includes(ROLES.ADMIN) || roles.includes(moduleRole);
}
