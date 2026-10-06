import { ROLES } from '../../../constants/roles';
import { assertPlatformStaff } from '../../../lib/platformAccess';
import type { GraphQLContext } from '../../../middleware/auth';
import type { PermissionAction } from '../../permissions/permission.model';
import { recordAudit } from '../../audit';

/** Exyconn's gateway accounts are platform settings, kept by the Tech team. */
export const techGuard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], action);

export const auditGateway = (ctx: GraphQLContext, summary: string, entityId?: unknown) =>
  recordAudit(ctx, { action: 'UPDATE', module: 'TechConfig', entityId, summary });

type Row = Record<string, unknown>;

/** Whether a sealed secret is stored on the row (the secret itself is never returned). */
export const hasValue = (field: string) => (row: Row) =>
  typeof row[field] === 'string' && row[field] !== '';

/** The stored hint (last four characters) of a secret, or null. */
export const hintOf = (field: string) => (row: Row) => (row[field] as string | undefined) || null;
