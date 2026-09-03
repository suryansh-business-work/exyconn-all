/**
 * Per-portal login screen defaults. Every portal app is its own site on its own
 * subdomain, so each one gets its own login artwork and wording while the sign-in
 * logic stays shared — Admin > Branding > Login Pages edits these, and the stored
 * values are merged over this list so a newly added app still renders.
 *
 * Backgrounds are free Pexels photos, referenced by their CDN URL (no API key).
 */

/** A Pexels photo scaled for a full-bleed background. */
const pexels = (id: number): string =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1920`;

export interface LoginPageConfig {
  /** Portal app key — matches the keys in `@exyconn/config/apps.json`. */
  app: string;
  /** Portal name shown above the sign-in card. */
  name: string;
  /** One line under the name. */
  tagline: string;
  /** Full-bleed background. Empty falls back to a flat brand surface. */
  backgroundImageUrl: string;
  /** Tint used for the overlay and the sign-in button on this portal. */
  accentColor: string;
}

export const LOGIN_PAGE_DEFAULTS: readonly LoginPageConfig[] = Object.freeze([
  {
    app: 'hub',
    name: 'Portal Home',
    tagline: 'Every team, every metric — one place.',
    backgroundImageUrl: pexels(946310),
    accentColor: '#155dfc',
  },
  {
    app: 'admin',
    name: 'Admin',
    tagline: 'Users, clients and platform settings.',
    backgroundImageUrl: pexels(32026165),
    accentColor: '#155dfc',
  },
  {
    app: 'employee',
    name: 'My Workspace',
    tagline: 'Your day at Exyconn, in one place.',
    backgroundImageUrl: pexels(669228),
    accentColor: '#14b8a6',
  },
  {
    app: 'finance',
    name: 'Finance',
    tagline: 'Invoices, billing and reimbursements.',
    backgroundImageUrl: pexels(6801680),
    accentColor: '#0ea5e9',
  },
  {
    app: 'support',
    name: 'Support',
    tagline: 'Employee support tickets, answered fast.',
    backgroundImageUrl: pexels(7681570),
    accentColor: '#e11d48',
  },
  {
    app: 'crm',
    name: 'CRM',
    tagline: 'Leads, deals and the whole pipeline.',
    backgroundImageUrl: pexels(8441789),
    accentColor: '#22c55e',
  },
  {
    app: 'products',
    name: 'Products',
    tagline: 'The product catalogue, end to end.',
    backgroundImageUrl: pexels(38195854),
    accentColor: '#f97316',
  },
  {
    app: 'legal',
    name: 'Legal',
    tagline: 'Contracts, documents and signatures.',
    backgroundImageUrl: pexels(6077326),
    accentColor: '#64748b',
  },
  {
    app: 'hr',
    name: 'HR',
    tagline: 'Workforce, leave and attendance.',
    backgroundImageUrl: pexels(5439152),
    accentColor: '#f59e0b',
  },
  {
    app: 'marketing',
    name: 'Marketing',
    tagline: 'Campaigns, content and reach.',
    backgroundImageUrl: pexels(7688100),
    accentColor: '#ec4899',
  },
  {
    app: 'projects',
    name: 'Projects',
    tagline: 'Projects, boards and bug tracking.',
    backgroundImageUrl: pexels(6804093),
    accentColor: '#0d9488',
  },
  {
    app: 'ai',
    name: 'AI',
    tagline: 'AI jobs, prompts and automations.',
    backgroundImageUrl: pexels(8386437),
    accentColor: '#6366f1',
  },
  {
    app: 'website',
    name: 'Website',
    tagline: 'exyconn.com content and submissions.',
    backgroundImageUrl: pexels(270488),
    accentColor: '#f97316',
  },
  {
    app: 'tracker',
    name: 'Time Tracker',
    tagline: 'Worked hours, activity and screenshots.',
    backgroundImageUrl: pexels(8406965),
    accentColor: '#0ea5e9',
  },
  {
    app: 'tech',
    name: 'Tech',
    tagline: 'Integrations, environments and builds.',
    backgroundImageUrl: pexels(17489163),
    accentColor: '#7c3aed',
  },
  {
    app: 'it',
    name: 'IT',
    tagline: 'Company hardware, licences and access.',
    backgroundImageUrl: pexels(7500056),
    accentColor: '#0891b2',
  },
]);
