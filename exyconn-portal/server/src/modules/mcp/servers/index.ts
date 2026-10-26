import { ROLES, type Role } from '../../../constants/roles';
import { CRM_MCP } from './crm.server';
import { MARKETING_MCP } from './marketing.server';
import type { McpEndpointKey, McpServerSpec } from './spec';

export type { McpEndpointKey, McpServerKey, McpServerSpec } from './spec';
export { CRM_MCP } from './crm.server';
export { MARKETING_MCP } from './marketing.server';

/**
 * Every module offered to Claude as its own MCP server. A new module's server is one entry here
 * (and its spec file beside this one) — see docs/portal/mcp/README.md.
 */
export const MCP_SERVERS: readonly McpServerSpec[] = [CRM_MCP, MARKETING_MCP];

/** The global server: every tool of every module the person may use, behind one connection. */
export const GLOBAL_MCP = {
  key: 'all',
  name: 'exyconn',
  label: 'All Exyconn tools',
  auditModule: 'Exyconn (Claude MCP)',
  instructions:
    'Exyconn: every module you can use (CRM, Marketing) as tools in one connection. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting, sending or publishing anything.',
} as const;

/** The address path of each endpoint, below the API's public URL. */
export const MCP_ENDPOINT_PATHS: Readonly<Record<McpEndpointKey, string>> = {
  crm: '/mcp/crm',
  marketing: '/mcp/marketing',
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
