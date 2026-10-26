import type { Model, Schema } from 'mongoose';

/** When a record was archived; null (or absent on rows saved before archiving existed) while live. */
export const ARCHIVED_FIELD = 'archivedAt';

/**
 * Lets any company record be archived: hidden from its table but kept, and restorable. Added to
 * every company model where the tenant scope is installed, so a grid's "Archive selected" works
 * for every module without a field in each schema. Unpaged lists and lookups still see archived
 * rows; only the paged tables (`tableQuery`, the CRM lists) leave them out unless asked.
 */
export function archivablePlugin(schema: Schema): void {
  if (!schema.path(ARCHIVED_FIELD)) {
    schema.add({ [ARCHIVED_FIELD]: { type: Date, default: null } });
  }
}

/** The filter for a table's live rows, or — when `archived` — its archived ones. */
export const archivedFilter = (archived: boolean | null | undefined) => ({
  [ARCHIVED_FIELD]: archived ? { $ne: null } : null,
});

/** Archives (or restores) these records of a model; returns how many changed. */
export async function archiveRecords(
  model: Model<never>,
  ids: string[],
  archived: boolean,
): Promise<number> {
  // Only the records not already in that state: timestamps stamp updatedAt on every match, so
  // matching them all would count records that did not change.
  const result = await model.updateMany(
    { _id: { $in: ids }, ...archivedFilter(!archived) } as never,
    {
      [ARCHIVED_FIELD]: archived ? new Date() : null,
    } as never,
  );
  return result.modifiedCount;
}
