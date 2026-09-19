import type { PermissionAction } from '@exyconn/shell/graphql/generated';

/** `APPROVE` → `Approve`, the way a column heading reads. */
export const actionLabel = (action: PermissionAction): string =>
  action.charAt(0) + action.slice(1).toLowerCase();
