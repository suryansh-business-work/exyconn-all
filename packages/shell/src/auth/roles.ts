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
  /** The AI agents console: WhatsApp, calling and website chat agents and their leads. */
  AGENTS: 'AGENTS',
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
  AGENTS: 'Agents',
};

/** A role's label, or the code itself for one this build does not know yet. */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role as Role] ?? role;
}

/** Several roles as one readable, translated line: "Employee, Admin, Super Admin". */
export function roleList(roles: readonly string[], t: (text: string) => string): string {
  return roles.map((role) => t(roleLabel(role))).join(', ');
}

/** Open on every plan: a company can always administer itself, and its people self-serve. */
const PLAN_FREE_ROLES: ReadonlySet<Role> = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.EMPLOYEE,
]);

/**
 * Whether the company's plan includes a module. `planRoles` null or absent means every module
 * is; the server enforces the same rule (roleGuard), this only keeps the navigation honest.
 */
export function planIncludes(moduleRole: Role, planRoles?: readonly Role[] | null): boolean {
  return !planRoles || PLAN_FREE_ROLES.has(moduleRole) || planRoles.includes(moduleRole);
}

/**
 * ADMIN sees everything in their own company; otherwise the user must hold the module's role.
 * Either way the company's plan must include the module.
 */
export function canAccess(
  roles: Role[],
  moduleRole: Role,
  planRoles?: readonly Role[] | null,
): boolean {
  if (moduleRole === ROLES.SUPER_ADMIN) {
    // The platform's own screens: ADMIN is the top of ONE company and never passes here.
    return roles.includes(ROLES.SUPER_ADMIN);
  }
  if (!planIncludes(moduleRole, planRoles)) {
    return false;
  }
  return roles.includes(ROLES.ADMIN) || roles.includes(moduleRole);
}
