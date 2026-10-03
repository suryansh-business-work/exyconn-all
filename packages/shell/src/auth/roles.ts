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

/**
 * Each role as people say it — "Super Admin", not SUPER_ADMIN. Written out rather than
 * derived: CRM, HR, AI and IT are names, and title-casing them reads as "Crm" and "It".
 * English source strings, translated where they are shown.
 */
export const ROLE_LABELS: Readonly<Record<Role, string>> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
  FINANCE: 'Finance',
  SUPPORT: 'Support',
  CRM: 'CRM',
  PRODUCTS: 'Products',
  LEGAL: 'Legal',
  HR: 'HR',
  MARKETING: 'Marketing',
  PROJECTS: 'Projects',
  AI: 'AI',
  WEBSITE: 'Website',
  TRACKER: 'Tracker',
  TECH: 'Tech',
  IT: 'IT',
  COMPLIANCE: 'Compliance',
};

/** A role's label, or the code itself for one this build does not know yet. */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role as Role] ?? role;
}

/** Several roles as one readable, translated line: "Employee, Admin, Super Admin". */
export function roleList(roles: readonly string[], t: (text: string) => string): string {
  return roles.map((role) => t(roleLabel(role))).join(', ');
}

/** ADMIN sees everything in their own company; otherwise the user must hold the module's role. */
export function canAccess(roles: Role[], moduleRole: Role): boolean {
  if (moduleRole === ROLES.SUPER_ADMIN) {
    // The platform's own screens: ADMIN is the top of ONE company and never passes here.
    return roles.includes(ROLES.SUPER_ADMIN);
  }
  return roles.includes(ROLES.ADMIN) || roles.includes(moduleRole);
}
