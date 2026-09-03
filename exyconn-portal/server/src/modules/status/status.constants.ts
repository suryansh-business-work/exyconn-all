/**
 * Shared vocabulary of the public status page plus the catalogue the monitor is
 * seeded with. The catalogue is *configuration*, not data: it is written to the
 * `statusmonitors` collection on first boot and is editable afterwards from
 * Tech > Status Monitors, so a new subdomain never means a code change.
 */

export const STATUS_CATEGORIES = ['WEBSITE', 'PORTAL', 'API', 'TOOL', 'DESKTOP_APP'] as const;
export type StatusCategory = (typeof STATUS_CATEGORIES)[number];

export const STATUS_STATES = ['OPERATIONAL', 'DEGRADED', 'DOWN', 'UNKNOWN'] as const;
export type StatusState = (typeof STATUS_STATES)[number];

export const PROBLEM_CATEGORIES = ['OUTAGE', 'SLOWNESS', 'LOGIN', 'DATA', 'UI', 'OTHER'] as const;
export const PROBLEM_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const PROBLEM_STATUSES = ['NEW', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

/** One monitored endpoint in the seed catalogue, before the domain is applied. */
interface TargetTemplate {
  key: string;
  name: string;
  description: string;
  category: StatusCategory;
  /** Subdomain of the platform domain; empty string means the apex domain. */
  subdomain: string;
  /** Path appended to the origin, e.g. an API's health endpoint. */
  path?: string;
}

/**
 * Every public surface Exyconn runs. The portal entries mirror the micro-frontend
 * registry (`@exyconn/config/apps.json`) — the server cannot import it (it is not in
 * the API's dependency graph), so the list is restated here and kept in step by the
 * `statusMonitors.test.ts` reminder that a new portal app needs a row.
 */
const TARGETS: readonly TargetTemplate[] = [
  {
    key: 'website',
    name: 'Website',
    description: 'The public exyconn.com site',
    category: 'WEBSITE',
    subdomain: '',
  },
  {
    key: 'portal-server',
    name: 'Portal API',
    description: 'GraphQL API behind every portal',
    category: 'API',
    subdomain: 'portal-server',
    path: '/health',
  },
  {
    key: 'hub',
    name: 'Portal Home',
    description: 'Module launcher, profile and settings',
    category: 'PORTAL',
    subdomain: 'portal',
  },
  {
    key: 'admin',
    name: 'Admin Portal',
    description: 'Users, branding and platform settings',
    category: 'PORTAL',
    subdomain: 'admin',
  },
  {
    key: 'employee',
    name: 'My Workspace',
    description: 'Employee self-service',
    category: 'PORTAL',
    subdomain: 'employee',
  },
  {
    key: 'hr',
    name: 'HR Portal',
    description: 'People, leave and payroll administration',
    category: 'PORTAL',
    subdomain: 'hr',
  },
  {
    key: 'finance',
    name: 'Finance Portal',
    description: 'Invoices, expenses and reporting',
    category: 'PORTAL',
    subdomain: 'finance',
  },
  {
    key: 'support',
    name: 'Support Portal',
    description: 'Helpdesk and ticket console',
    category: 'PORTAL',
    subdomain: 'support',
  },
  {
    key: 'crm',
    name: 'CRM Portal',
    description: 'Leads, clients and pipeline',
    category: 'PORTAL',
    subdomain: 'crm',
  },
  {
    key: 'products',
    name: 'Products Portal',
    description: 'Product catalogue and releases',
    category: 'PORTAL',
    subdomain: 'products',
  },
  {
    key: 'projects',
    name: 'Projects Portal',
    description: 'Boards, tasks and bug tracking',
    category: 'PORTAL',
    subdomain: 'projects',
  },
  {
    key: 'marketing',
    name: 'Marketing Portal',
    description: 'Campaigns and content',
    category: 'PORTAL',
    subdomain: 'marketing',
  },
  {
    key: 'legal',
    name: 'Legal Portal',
    description: 'Contracts and compliance',
    category: 'PORTAL',
    subdomain: 'legal',
  },
  {
    key: 'ai',
    name: 'AI Portal',
    description: 'AI workspaces and assistants',
    category: 'PORTAL',
    subdomain: 'ai',
  },
  {
    key: 'website-portal',
    name: 'Website Portal',
    description: 'Website content administration',
    category: 'PORTAL',
    subdomain: 'website',
  },
  {
    key: 'tracker',
    name: 'Tracker Portal',
    description: 'Time tracking console',
    category: 'PORTAL',
    subdomain: 'tracker',
  },
  {
    key: 'tech',
    name: 'Tech Portal',
    description: 'Integrations, credentials and builds',
    category: 'PORTAL',
    subdomain: 'tech',
  },
  {
    key: 'it',
    name: 'IT Portal',
    description: 'Asset register',
    category: 'PORTAL',
    subdomain: 'it',
  },
  {
    key: 'status',
    name: 'Status Page',
    description: 'This page',
    category: 'PORTAL',
    subdomain: 'status',
  },
  {
    key: 'tools',
    name: 'Tools',
    description: 'Public utility apps',
    category: 'TOOL',
    subdomain: 'tools',
  },
  {
    key: 'tools-api',
    name: 'Tools API',
    description: 'API behind the utility apps',
    category: 'API',
    subdomain: 'tools-api',
    path: '/health',
  },
];

/** One seed row: the template with its URL resolved against the platform domain. */
export interface StatusTarget extends Omit<TargetTemplate, 'subdomain' | 'path'> {
  url: string;
  order: number;
}

/** Resolves the catalogue against the platform domain (and the tracker download URL). */
export function statusTargets(domain: string, trackerDownloadUrl: string): StatusTarget[] {
  const resolved = TARGETS.map(({ subdomain, path, ...target }, index) => {
    const host = subdomain ? `${subdomain}.${domain}` : domain;
    return { ...target, url: `https://${host}${path ?? ''}`, order: index };
  });
  return [
    ...resolved,
    {
      key: 'tracker-app',
      name: 'Tracker Desktop App',
      description: 'Download and update channel for the desktop time tracker',
      category: 'DESKTOP_APP' as StatusCategory,
      url: trackerDownloadUrl,
      order: resolved.length,
    },
  ];
}
