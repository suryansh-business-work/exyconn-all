import type { GraphQLContext } from '../../middleware/auth';
import { recordAudit, type AuditAction } from '../audit';

/** Where the CRM's Gmail changes and sends show in Admin > Audit. */
export const GMAIL_AUDIT_MODULE = 'CrmGmail';

/** One audit line for a Gmail account change or a sent email, never with its body or tokens. */
export const auditGmail = (
  ctx: GraphQLContext,
  action: AuditAction,
  entity: { id: string; label: string },
  summary: string,
) =>
  recordAudit(ctx, {
    action,
    module: GMAIL_AUDIT_MODULE,
    entityId: entity.id,
    entityLabel: entity.label,
    summary,
  });
