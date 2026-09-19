import mongoose from 'mongoose';
import { PLATFORM_MODELS, PLATFORM_UNIQUE_PATHS } from './platform-models';
import { ORGANIZATION_FIELD } from './tenant-plugin';
import { logger } from '../../utils/logger';

interface IndexInfo {
  name?: string;
  key: Record<string, unknown>;
  unique?: boolean;
}

/** Whether a unique index on one company's data spans every company — which it never should. */
function isPlatformWide(index: IndexInfo, platformPaths: ReadonlySet<string>): boolean {
  if (index.unique !== true || index.name === '_id_') return false;
  const fields = Object.keys(index.key);
  if (fields.includes(ORGANIZATION_FIELD)) return false;
  // Sign-in identity (a user's email) is deliberately unique across the platform.
  return !fields.every((field) => platformPaths.has(field));
}

/**
 * Drops every unique index on a company's data that is not scoped to the company.
 *
 * The schemas make unique fields unique WITHIN an organization (see scopeUniqueIndexes), but
 * Mongo keeps any index it was once given: a collection created before the tenancy still
 * carries its old `name_1`, so the second company to add an "Engineering" department is told
 * the name is taken by a record it cannot see. Only the stray index goes — the scoped one the
 * schema declares is built by Mongoose as usual. Runs at boot; costs one listing per model.
 */
export async function dropPlatformWideUniqueIndexes(): Promise<string[]> {
  const dropped: string[] = [];
  for (const [modelName, model] of Object.entries(mongoose.models)) {
    if (PLATFORM_MODELS.has(modelName)) continue;
    const platformPaths = PLATFORM_UNIQUE_PATHS.get(modelName) ?? new Set<string>();
    let indexes: IndexInfo[];
    try {
      indexes = (await model.collection.indexes()) as IndexInfo[];
    } catch {
      // No collection yet: nothing has been written, so there is no stray index either.
      continue;
    }
    for (const index of indexes.filter((row) => isPlatformWide(row, platformPaths))) {
      const name = String(index.name);
      await model.collection.dropIndex(name);
      dropped.push(`${modelName}.${name}`);
    }
  }
  if (dropped.length > 0) {
    logger.warn(`Dropped unique indexes that spanned every organization: ${dropped.join(', ')}`);
  }
  return dropped;
}
