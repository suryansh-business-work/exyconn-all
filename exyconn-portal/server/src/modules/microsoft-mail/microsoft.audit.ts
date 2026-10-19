import type { GraphQLContext } from '../../middleware/auth';
import { recordAudit, type AuditAction } from '../audit';

/** Where the CRM's Microsoft mailbox changes and sends show in Admin > Audit. */
export const MICROSOFT_AUDIT_MODULE = 'CrmMicrosoftMail';

/** One audit line for a mailbox change or a sent email, never with its body or tokens. */
export const auditMicrosoft = (
  ctx: GraphQLContext,
  action: AuditAction,
  entity: { id: string; label: string },
  summary: string,
) =>
  recordAudit(ctx, {
    action,
    module: MICROSOFT_AUDIT_MODULE,
    entityId: entity.id,
    entityLabel: entity.label,
    summary,
  });
