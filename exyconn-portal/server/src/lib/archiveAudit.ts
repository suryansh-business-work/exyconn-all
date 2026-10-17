import { recordAudit } from '../modules/audit';
import type { GraphQLContext } from '../middleware/auth';

/** One audit entry per record archived or restored from a table, in the module's own log. */
export async function auditArchive(
  ctx: GraphQLContext,
  module: string,
  ids: string[],
  archived: boolean,
): Promise<void> {
  const summary = archived ? `Archived ${module}` : `Restored ${module}`;
  await Promise.all(
    ids.map((id) => recordAudit(ctx, { action: 'UPDATE', module, entityId: id, summary })),
  );
}
