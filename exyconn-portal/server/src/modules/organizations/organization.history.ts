import { AuditLogModel } from '../audit/audit.model';
import { runAsPlatform } from '../../lib/tenant';

/** How much of one organization's history the console reads at once. */
const HISTORY_LIMIT = 200;

/**
 * Everything done to one organization, newest first.
 *
 * Read across tenants: a platform administrator's changes are stamped into whichever company
 * they were working in at the time, so the organization's own scope alone would miss some.
 */
export function organizationHistory(organizationId: string) {
  return runAsPlatform(() =>
    AuditLogModel.find({ module: 'Organization', entityId: organizationId })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .lean(),
  );
}
