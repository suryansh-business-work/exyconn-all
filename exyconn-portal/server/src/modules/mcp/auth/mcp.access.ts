import type { GraphQLContext } from '../../../middleware/auth';
import { assertRole } from '../../../middleware/roleGuard';
import type { Role } from '../../../constants/roles';
import type { TokenPayload } from '../../../utils/jwt';
import {
  MCP_SERVERS,
  serverSpec,
  serversOf,
  type McpEndpointKey,
  type McpServerKey,
} from '../servers';

/** The roles that open an endpoint: its module's, or any module's for the global one. */
function rolesFor(endpoint: McpEndpointKey): Role[] {
  if (endpoint === 'all') {
    return MCP_SERVERS.map((spec) => spec.role);
  }
  const spec = serverSpec(endpoint);
  return spec ? [spec.role] : [];
}

/**
 * Asserts the caller may use the endpoint — connect it, read its tools, usage and activity —
 * and returns them. ADMIN passes as in every guard.
 */
export function assertEndpointAccess(ctx: GraphQLContext, endpoint: McpEndpointKey): TokenPayload {
  return assertRole(ctx, rolesFor(endpoint));
}

/** The module servers an endpoint covers for the caller, after asserting they may use it. */
export function serversInReach(ctx: GraphQLContext, endpoint: McpEndpointKey): McpServerKey[] {
  const user = assertEndpointAccess(ctx, endpoint);
  return serversOf(endpoint, (user.roles ?? []) as Role[]).map((spec) => spec.key);
}
