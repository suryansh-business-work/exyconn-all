import { Schema, Types, type Query } from 'mongoose';
import { stringOf } from '../../utils/serialize';
import { PLATFORM_UNIQUE_PATHS } from './platform-models';
import { TenantScopeError, currentScope, requireScope } from './tenant-scope';

/** What a path's own index declaration looks like: `index: true`, or options, or nothing. */
type PathIndex = { unique?: boolean; sparse?: boolean } | boolean | null | undefined;

/** The field every tenant record carries. */
export const ORGANIZATION_FIELD = 'organizationId';

/**
 * Every way a query can read or change documents; each one is confined to the organization.
 * A pattern rather than a list because Mongoose types `pre()` per operation name, and one
 * handler serves them all.
 */
const QUERY_HOOKS =
  /^(count|countDocuments|deleteMany|deleteOne|distinct|find|findOne|findOneAndDelete|findOneAndReplace|findOneAndUpdate|replaceOne|updateMany|updateOne)$/;

/** The model a person's own account lives in — the one record that follows them across companies. */
const ACCOUNT_MODEL = 'User';

/** The id a query or document names, when it names exactly one. */
function singleId(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  return value instanceof Types.ObjectId ? value.toHexString() : null;
}

/**
 * The caller's own company when this touches the caller's own account while they work inside
 * another company (a platform administrator who switched), else null. Only a lookup by that
 * account's exact id qualifies, so a list of the company's people never includes them.
 */
function selfOrganization(name: string, id: unknown): string | null {
  const self = currentScope()?.self;
  if (name !== ACCOUNT_MODEL || !self) {
    return null;
  }
  return singleId(id) === self.userId ? self.organizationId : null;
}

/** The organization a read or write belongs to, or null when it spans the platform. */
function scopedOrganization(what: string): string | null {
  const scope = requireScope(what);
  if (scope.platform) {
    return null;
  }
  if (scope.organizationId === null) {
    throw new TenantScopeError(what);
  }
  return scope.organizationId;
}

/**
 * Makes every unique index unique WITHIN an organization instead of across the platform:
 * two companies may both have an invoice 001 or a product SKU A-1. Path-level `unique: true`
 * is turned off and re-declared as a compound index, since the path option alone cannot
 * express the pair.
 *
 * The exceptions are in PLATFORM_UNIQUE_PATHS — sign-in identity, which is global.
 */
function scopeUniqueIndexes(name: string, schema: Schema): void {
  const global = PLATFORM_UNIQUE_PATHS.get(name) ?? new Set<string>();

  schema.eachPath((path, type) => {
    // `_index` is what the schema builds its indexes from; the path's options only describe
    // what was written in the model file.
    // `index: true` leaves a boolean here; only an object can carry `unique`.
    const declared = (type as unknown as { _index?: PathIndex })._index;
    if (typeof declared !== 'object' || declared?.unique !== true) {
      return;
    }
    if (global.has(path)) {
      return;
    }
    const sparse = declared.sparse === true;
    (type as unknown as { _index: false })._index = false;
    (type.options as { unique?: boolean }).unique = false;
    schema.index({ [ORGANIZATION_FIELD]: 1, [path]: 1 }, { unique: true, sparse });
  });

  // Compound uniques declared on the schema gain the organization as their FIRST key. The
  // key object is rebuilt in place (same reference, so the schema sees it) because an index's
  // order is its key order, and the organization has to lead for the index to be usable.
  for (const [fields, options] of schema.indexes()) {
    const declared = options as { unique?: boolean };
    if (declared.unique !== true || ORGANIZATION_FIELD in fields) {
      continue;
    }
    const original = { ...fields };
    for (const key of Object.keys(fields)) {
      delete fields[key];
    }
    fields[ORGANIZATION_FIELD] = 1;
    Object.assign(fields, original);
  }
}

/**
 * Confines a model to one organization.
 *
 * Applied to every model that is not listed as platform-wide (see platform-models.ts and
 * install.ts), so a model added later is private to its company by default. It adds the
 * organization to the schema, filters every query by it, stamps it on every write, and
 * refuses to run at all when no organization is in scope — a missed filter is an error
 * rather than one company reading another's data.
 */
export function tenantPlugin(schema: Schema, options: { name: string }): void {
  const { name } = options;
  schema.add({
    [ORGANIZATION_FIELD]: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
  });
  scopeUniqueIndexes(name, schema);

  schema.pre(QUERY_HOOKS, function (this: Query<unknown, unknown>) {
    // `op` is the operation the query will run (find, updateMany…), for a legible refusal.
    const { op } = this as unknown as { op?: string };
    const scoped = scopedOrganization(`${name}.${op ?? 'query'}()`);
    const organizationId = selfOrganization(name, this.getFilter()._id) ?? scoped;
    if (organizationId !== null) {
      this.where({ [ORGANIZATION_FIELD]: organizationId });
    }
  });

  schema.pre('aggregate', function () {
    const organizationId = scopedOrganization(`${name}.aggregate()`);
    if (organizationId !== null) {
      this.pipeline().unshift({
        $match: { [ORGANIZATION_FIELD]: new Types.ObjectId(organizationId) },
      });
    }
  });

  schema.pre('save', function () {
    const doc = this as unknown as Record<string, unknown>;
    if (selfOrganization(name, doc._id) === null) {
      stamp(doc, `${name}.save()`);
    }
  });

  // `insertMany` middleware is given a callback and WAITS for it: forgetting to call it hangs
  // every bulk insert in the process.
  schema.pre('insertMany', function (next, docs: Record<string, unknown>[]) {
    try {
      for (const doc of docs) {
        stamp(doc, `${name}.insertMany()`);
      }
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error(stringOf(error)));
    }
  });
}

/**
 * Writes the organization onto a document. A document that already names a DIFFERENT one is
 * refused: that is a write crossing a company boundary, never something to paper over.
 */
function stamp(doc: Record<string, unknown>, what: string): void {
  const organizationId = scopedOrganization(what);
  if (organizationId === null) {
    return;
  }
  const current = doc[ORGANIZATION_FIELD];
  if (current === undefined || current === null) {
    doc[ORGANIZATION_FIELD] = new Types.ObjectId(organizationId);
    return;
  }
  if (stringOf(current) !== organizationId) {
    throw new TenantScopeError(`${what} tried to write another organization's record`);
  }
}
