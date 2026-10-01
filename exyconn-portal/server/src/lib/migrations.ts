import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { logger } from '../utils/logger';

/**
 * One line per data repair that has run, so it never runs again.
 *
 * Tenant-scoped on purpose: a repair run inside `forEachOrganization` is recorded for that
 * company alone, so a company created later still gets it, and one run as the platform
 * (`runAsPlatform`) carries no organization and is recorded once for the install.
 */
const migrationSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    ranAt: { type: Date, required: true },
  },
  { timestamps: false },
);

export type MigrationDocument = InferSchemaType<typeof migrationSchema>;
export const MigrationModel: Model<MigrationDocument> = model<MigrationDocument>(
  'Migration',
  migrationSchema,
);

/**
 * Runs a one-shot data repair exactly once in the current scope, and records that it did.
 *
 * This is the boot-time home for a backfill that exists because a schema changed under
 * records already stored — a field added with a default that `.lean()` will never apply, a
 * value that was stored in the wrong shape. Before the ledger every such repair ran on every
 * boot of every company forever; now each costs one indexed read once it has run. A repair
 * that throws is not recorded, so it is retried on the next boot.
 *
 * Not for seeds: an "ensure the defaults exist" step is insert-only and cheap, and has to keep
 * running so a fresh company gets them too.
 */
export async function runOnce(name: string, work: () => Promise<unknown>): Promise<boolean> {
  const done = await MigrationModel.exists({ name });
  if (done) {
    return false;
  }
  await work();
  await MigrationModel.create({ name, ranAt: new Date() });
  logger.info(`Data repair "${name}" ran`);
  return true;
}
