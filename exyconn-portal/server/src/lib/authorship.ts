import { Schema, Types, isObjectIdOrHexString, type Query, type UpdateQuery } from 'mongoose';
import { currentRequestInfo } from './requestInfo';

/** Who first wrote a record: the signed-in person (or API key) whose request created it. */
export const CREATED_BY_FIELD = 'createdBy';
/** Who last changed a record; set together with createdBy when the record is first written. */
export const UPDATED_BY_FIELD = 'updatedBy';

/** Every query that changes documents in place (replacements carry their own whole document). */
const UPDATE_HOOKS = /^(updateOne|updateMany|findOneAndUpdate)$/;

/**
 * The caller of the request in hand, or null when there is none: a background job, boot
 * seeding, a sign-in that has not identified anyone yet. Those writes keep the field as it is.
 */
function currentActor(): Types.ObjectId | null {
  const id = currentRequestInfo()?.actorId;
  return id && isObjectIdOrHexString(id) ? new Types.ObjectId(id) : null;
}

/**
 * Records when and by whom every record was created and last changed, without each service
 * remembering to: `createdAt`/`updatedAt` through Mongoose timestamps, `createdBy`/`updatedBy`
 * from the request's signed-in caller (see middleware/auth.ts → setRequestActor).
 *
 * A schema that already declares its own `timestamps` option, `createdBy` or `updatedBy` keeps
 * it — several modules store an email there, written by their own service.
 *
 * Not covered: `bulkWrite` and raw driver calls, which run no Mongoose middleware.
 */
export function authorshipPlugin(schema: Schema): void {
  if (schema.get('timestamps') === undefined) {
    schema.set('timestamps', true);
  }
  const ownsCreated = schema.path(CREATED_BY_FIELD) === undefined;
  const ownsUpdated = schema.path(UPDATED_BY_FIELD) === undefined;
  if (ownsCreated) {
    schema.add({ [CREATED_BY_FIELD]: { type: Schema.Types.ObjectId, default: null } });
  }
  if (ownsUpdated) {
    schema.add({ [UPDATED_BY_FIELD]: { type: Schema.Types.ObjectId, default: null } });
  }

  /** Stamps a record being inserted: its creator is also its last editor. */
  const stampNew = (doc: Record<string, unknown>, actor: Types.ObjectId): void => {
    if (ownsCreated) {
      doc[CREATED_BY_FIELD] ??= actor;
    }
    if (ownsUpdated) {
      doc[UPDATED_BY_FIELD] = actor;
    }
  };

  schema.pre('save', function () {
    const actor = currentActor();
    if (actor === null) {
      return;
    }
    if (this.isNew) {
      stampNew(this as unknown as Record<string, unknown>, actor);
    } else if (ownsUpdated && this.isModified()) {
      this.set(UPDATED_BY_FIELD, actor);
    }
  });

  // `insertMany` middleware is given a callback and WAITS for it (see tenant-plugin.ts).
  schema.pre('insertMany', function (next, docs: Record<string, unknown>[]) {
    const actor = currentActor();
    if (actor !== null) {
      for (const doc of docs) {
        stampNew(doc, actor);
      }
    }
    next();
  });

  schema.pre(UPDATE_HOOKS, function (this: Query<unknown, unknown>) {
    const actor = currentActor();
    const update = this.getUpdate();
    // An aggregation-pipeline update has no $set to add to.
    if (actor === null || update === null || Array.isArray(update)) {
      return;
    }
    if (ownsUpdated) {
      this.set(UPDATED_BY_FIELD, actor);
    }
    if (ownsCreated && this.getOptions().upsert === true) {
      const changes = update as UpdateQuery<Record<string, unknown>>;
      changes.$setOnInsert = { ...changes.$setOnInsert, [CREATED_BY_FIELD]: actor };
    }
  });
}
