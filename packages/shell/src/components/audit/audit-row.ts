import type { AuditLogRowFragment } from '@/graphql/generated';

/** One audit entry as every audit grid and drawer reads it, whichever query fetched it. */
export type AuditLogRow = AuditLogRowFragment;
