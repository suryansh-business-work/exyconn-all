import { ROLES, type Role } from '../../../constants/roles';
import { CRM_MCP } from './crm.server';
import { MARKETING_MCP } from './marketing.server';
import { ADMIN_MCP } from './admin.server';
import { AI_MCP } from './ai.server';
import { CLIENTHUB_MCP } from './clienthub.server';
import { COMPLIANCE_MCP } from './compliance.server';
import { EMPLOYEE_MCP } from './employee.server';
import { FINANCE_MCP } from './finance.server';
import { HR_MCP } from './hr.server';
import { IT_MCP } from './it.server';
import { LEGAL_MCP } from './legal.server';
import { PRODUCTS_MCP } from './products.server';
import { PROJECTS_MCP } from './projects.server';
import { SOCIAL_MCP } from './social.server';
import { STATUS_MCP } from './status.server';
import { SUPPORT_MCP } from './support.server';
import { TECH_MCP } from './tech.server';
import { TRACKER_MCP } from './tracker.server';
import { WEBSITE_MCP } from './website.server';
import { SHARED_TYPEDEFS } from './shared';
import type { McpEndpointKey, McpServerSpec } from './spec';

export type { McpEndpointKey, McpServerKey, McpServerSpec } from './spec';
export { CRM_MCP } from './crm.server';
export { MARKETING_MCP } from './marketing.server';
export { ADMIN_MCP } from './admin.server';
export { AI_MCP } from './ai.server';
export { CLIENTHUB_MCP } from './clienthub.server';
export { COMPLIANCE_MCP } from './compliance.server';
export { EMPLOYEE_MCP } from './employee.server';
export { FINANCE_MCP } from './finance.server';
export { HR_MCP } from './hr.server';
export { IT_MCP } from './it.server';
export { LEGAL_MCP } from './legal.server';
export { PRODUCTS_MCP } from './products.server';
export { PROJECTS_MCP } from './projects.server';
export { SOCIAL_MCP } from './social.server';
export { STATUS_MCP } from './status.server';
export { SUPPORT_MCP } from './support.server';
export { TECH_MCP } from './tech.server';
export { TRACKER_MCP } from './tracker.server';
export { WEBSITE_MCP } from './website.server';

/** A module's server with the operations every portal shares (see shared.ts). */
const withShared = (spec: McpServerSpec): McpServerSpec => ({
  ...spec,
  typeDefs: [...spec.typeDefs, ...SHARED_TYPEDEFS],
});

/**
 * Every module offered to Claude as its own MCP server. A new module's server is one entry here
 * (and its spec file beside this one) — see docs/portal/mcp/README.md.
 */
export const MCP_SERVERS: readonly McpServerSpec[] = [
  CRM_MCP,
  MARKETING_MCP,
  ADMIN_MCP,
  AI_MCP,
  CLIENTHUB_MCP,
  COMPLIANCE_MCP,
  EMPLOYEE_MCP,
  FINANCE_MCP,
  HR_MCP,
  IT_MCP,
  LEGAL_MCP,
  PRODUCTS_MCP,
  PROJECTS_MCP,
  SOCIAL_MCP,
  STATUS_MCP,
  SUPPORT_MCP,
  TECH_MCP,
  TRACKER_MCP,
  WEBSITE_MCP,
].map(withShared);

/** The global server: every tool of every module the person may use, behind one connection. */
export const GLOBAL_MCP = {
  key: 'all',
  name: 'exyconn',
  label: 'All Exyconn tools',
  auditModule: 'Exyconn (Claude MCP)',
  instructions:
    'Exyconn: every module you can use (CRM, Marketing, HR, Finance, Projects, Support, IT, Tech and the rest) as tools in one connection. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting, sending or publishing anything.',
} as const;

/** The address path of each endpoint, below the API's public URL. */
export const MCP_ENDPOINT_PATHS: Readonly<Record<McpEndpointKey, string>> = {
  crm: '/mcp/crm',
  marketing: '/mcp/marketing',
  admin: '/mcp/admin',
  ai: '/mcp/ai',
  clienthub: '/mcp/clienthub',
  compliance: '/mcp/compliance',
  employee: '/mcp/employee',
  finance: '/mcp/finance',
  hr: '/mcp/hr',
  it: '/mcp/it',
  legal: '/mcp/legal',
  products: '/mcp/products',
  projects: '/mcp/projects',
  social: '/mcp/social',
  status: '/mcp/status',
  support: '/mcp/support',
  tech: '/mcp/tech',
  tracker: '/mcp/tracker',
  website: '/mcp/website',
  all: '/mcp/all',
};

/**
 * The CRM's first address, from before there was more than one server. Connectors already
 * pointed at it keep working; new ones are shown `/mcp/crm`.
 */
export const LEGACY_CRM_PATH = '/mcp';

const BY_KEY = new Map<string, McpServerSpec>(MCP_SERVERS.map((spec) => [spec.key, spec]));

/** One module's server, or undefined for a key that is none. */
export function serverSpec(key: string): McpServerSpec | undefined {
  return BY_KEY.get(key);
}

/** Whether a person with these roles may use the server (ADMIN may use every one). */
export function mayUse(roles: readonly Role[], spec: McpServerSpec): boolean {
  return roles.includes(ROLES.ADMIN) || roles.includes(spec.role);
}

/** The module servers a person with these roles may use, in registry order. */
export function serversFor(roles: readonly Role[]): McpServerSpec[] {
  return MCP_SERVERS.filter((spec) => mayUse(roles, spec));
}

/** The module servers an endpoint reaches for these roles: itself, or all of them for `all`. */
export function serversOf(endpoint: McpEndpointKey, roles: readonly Role[]): McpServerSpec[] {
  if (endpoint === 'all') {
    return serversFor(roles);
  }
  const spec = BY_KEY.get(endpoint);
  return spec && mayUse(roles, spec) ? [spec] : [];
}

/** What an endpoint says about itself: its label, MCP name, audit module and instructions. */
export type McpEndpointMeta = Pick<
  McpServerSpec,
  'label' | 'name' | 'auditModule' | 'instructions'
>;

const META = new Map<McpEndpointKey, McpEndpointMeta>([
  ...MCP_SERVERS.map((spec) => [spec.key, spec] as const),
  ['all', GLOBAL_MCP],
]);

/** An endpoint's label, MCP name, audit module and instructions. */
export function endpointMeta(endpoint: McpEndpointKey): McpEndpointMeta {
  return META.get(endpoint) ?? GLOBAL_MCP;
}

/** Every endpoint key, the module servers first. */
export const MCP_ENDPOINTS: readonly McpEndpointKey[] = [
  ...MCP_SERVERS.map((spec) => spec.key),
  'all',
];

/**
 * The endpoint an OAuth `resource` names (RFC 8707): the server address the client connects
 * to. A client that sends none connected to the first, CRM-only address, so it gets the CRM.
 */
export function endpointOfResource(resource: string): McpEndpointKey | null {
  if (!resource) {
    return 'crm';
  }
  let path: string;
  try {
    path = new URL(resource).pathname.replace(/\/$/, '');
  } catch {
    return null;
  }
  if (path === LEGACY_CRM_PATH) {
    return 'crm';
  }
  return MCP_ENDPOINTS.find((key) => MCP_ENDPOINT_PATHS[key] === path) ?? null;
}
