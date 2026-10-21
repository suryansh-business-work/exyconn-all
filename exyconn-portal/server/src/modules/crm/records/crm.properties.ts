import type { HydratedDocument } from 'mongoose';
import { recordAudit } from '../../audit';
import { badRequest, notFound } from '../../../utils/errors';
import { inSequence } from '../../../utils/inSequence';
import type { GraphQLContext } from '../../../middleware/auth';
import { CrmPropertyModel, type CrmPropertyDocument } from './crm-property.model';
import {
  CHOICE_TYPES,
  isBuiltInKey,
  OBJECT_DEFS,
  type CrmObject,
  type PropertyOption,
  type PropertyType,
} from './crm.objects';

/**
 * CRM > Settings > Properties: the fields a company adds to its records. The key and type are
 * fixed once created — stored values were written for them — while the label, choices, help
 * text and whether a value is required can change. Deleting a property deletes its values.
 */
export const AUDIT_MODULE = 'CrmProperty';
const MAX_PER_OBJECT = 100;
const MAX_OPTIONS = 100;
const MAX_LABEL = 80;
const MAX_DESCRIPTION = 300;
const MAX_KEY = 40;
/** MongoDB's code for a write the unique {object, key} index refused. */
const DUPLICATE_KEY = 11000;

/**
 * The same rule as `CRM_PROPERTY_KEY` in @exyconn/regex, which the settings form uses (the
 * server cannot load that ES module): a letter, then lowercase letters, digits and `_`.
 */
function isPropertyKey(key: string): boolean {
  const isLower = (c: string) => c >= 'a' && c <= 'z';
  const isTail = (c: string) => isLower(c) || (c >= '0' && c <= '9') || c === '_';
  return key.length >= 1 && key.length <= MAX_KEY && isLower(key[0]) && [...key].every(isTail);
}

export interface CrmPropertyInput {
  object: CrmObject;
  key: string;
  label: string;
  type: PropertyType;
  options: PropertyOption[];
  required: boolean;
  description: string;
}
export type CrmPropertyUpdate = Pick<
  CrmPropertyInput,
  'label' | 'options' | 'required' | 'description'
>;

type PropertyRow = CrmPropertyInput & { _id: { toHexString(): string }; order: number };

const present = (row: PropertyRow) => ({
  id: row._id.toHexString(),
  object: row.object,
  key: row.key,
  label: row.label,
  type: row.type,
  options: row.options ?? [],
  required: row.required,
  description: row.description ?? '',
  order: row.order,
});

function cleanOptions(type: PropertyType, options: PropertyOption[]): PropertyOption[] {
  if (!CHOICE_TYPES.has(type)) {
    return [];
  }
  const cleaned = options.map((o) => ({ value: o.value.trim(), label: o.label.trim() }));
  const values = new Set(cleaned.map((o) => o.value.toLowerCase()));
  if (cleaned.length === 0 || cleaned.length > MAX_OPTIONS) {
    badRequest(`A dropdown, radio or multi-select needs 1 to ${MAX_OPTIONS} choices`);
  }
  if (cleaned.some((o) => !o.value || !o.label) || values.size !== cleaned.length) {
    badRequest('Every choice needs a value and a label, and no two choices may share a value');
  }
  return cleaned;
}

function cleanText(update: CrmPropertyUpdate) {
  const label = update.label.trim();
  const description = update.description.trim();
  if (!label || label.length > MAX_LABEL) {
    badRequest(`Give the property a label of 1 to ${MAX_LABEL} characters`);
  }
  if (description.length > MAX_DESCRIPTION) {
    badRequest(`The help text is limited to ${MAX_DESCRIPTION} characters`);
  }
  return { label, description, required: update.required };
}

export async function listProperties(object: CrmObject) {
  const rows = await CrmPropertyModel.find({ object }).sort({ order: 1, createdAt: 1 }).lean();
  return rows.map((row) => present(row as unknown as PropertyRow));
}

/** A new property for several record types at once: one row per type, all with the same key. */
export type CrmPropertiesInput = Omit<CrmPropertyInput, 'object'> & { objects: CrmObject[] };

/** Why the key cannot be used on this record type, or null when it is free. */
async function keyProblem(object: CrmObject, key: string): Promise<string | null> {
  const { plural } = OBJECT_DEFS[object];
  if (isBuiltInKey(object, key)) {
    return `"${key}" is already a built-in property of ${plural}`;
  }
  if (await CrmPropertyModel.exists({ object, key })) {
    return `The ${plural} already have a property with the key "${key}"`;
  }
  if ((await CrmPropertyModel.countDocuments({ object })) >= MAX_PER_OBJECT) {
    return `The ${plural} already have ${MAX_PER_OBJECT} properties, the most a record type can have`;
  }
  return null;
}

/**
 * Creates the property on every chosen record type. Every type is checked before anything is
 * written, and a write that still fails (a colleague took the key a moment earlier) takes back
 * the rows already made, so the types never end up half done.
 */
export async function createProperties(ctx: GraphQLContext, input: CrmPropertiesInput) {
  const objects = [...new Set(input.objects)];
  if (objects.length === 0) {
    badRequest('Choose at least one record type for the property');
  }
  const key = input.key.trim();
  if (!isPropertyKey(key)) {
    badRequest('The key starts with a letter and uses lowercase letters, digits and _ (up to 40)');
  }
  const options = cleanOptions(input.type, input.options);
  const text = cleanText(input);
  const problems = await Promise.all(objects.map((object) => keyProblem(object, key)));
  const blocking = problems.filter((problem): problem is string => problem !== null);
  if (blocking.length > 0) {
    badRequest(blocking.join('. '));
  }

  const created: HydratedDocument<CrmPropertyDocument>[] = [];
  try {
    // One type at a time, so a failure leaves `created` naming exactly the rows to roll back.
    await inSequence(objects, async (object) => {
      const order = await CrmPropertyModel.countDocuments({ object });
      created.push(
        await CrmPropertyModel.create({ object, key, type: input.type, options, order, ...text }),
      );
    });
  } catch (error) {
    await CrmPropertyModel.deleteMany({ _id: { $in: created.map((row) => row._id) } });
    if ((error as { code?: number }).code === DUPLICATE_KEY) {
      badRequest(`A property with the key "${key}" was added a moment ago. Try another key.`);
    }
    throw error;
  }

  // In creation order, so the audit log reads the way the properties were added.
  await inSequence(created, (row) =>
    recordAudit(ctx, {
      action: 'CREATE',
      module: AUDIT_MODULE,
      entityId: row._id,
      entityLabel: row.label,
      summary: `Added the ${OBJECT_DEFS[row.object].module} property "${row.label}" (${row.type})`,
    }),
  );
  return created.map((row) => present(row.toObject() as unknown as PropertyRow));
}

/** The single-type create, kept for callers that still send one `object`. */
export async function createProperty(ctx: GraphQLContext, input: CrmPropertyInput) {
  const { object, ...rest } = input;
  const [row] = await createProperties(ctx, { ...rest, objects: [object] });
  return row;
}

export async function updateProperty(ctx: GraphQLContext, id: string, update: CrmPropertyUpdate) {
  const before = await CrmPropertyModel.findById(id).lean();
  if (!before) {
    notFound('Property');
  }
  const changes = { ...cleanText(update), options: cleanOptions(before.type, update.options) };
  const row = await CrmPropertyModel.findByIdAndUpdate(id, changes, { new: true }).lean();
  if (!row) {
    notFound('Property');
  }
  await recordAudit(ctx, {
    action: 'UPDATE',
    module: AUDIT_MODULE,
    entityId: row._id,
    entityLabel: row.label,
    summary: `Changed the ${OBJECT_DEFS[row.object].module} property "${row.label}"`,
  });
  return present(row);
}

export async function deleteProperty(ctx: GraphQLContext, id: string): Promise<boolean> {
  const row = await CrmPropertyModel.findById(id).lean();
  if (!row) {
    notFound('Property');
  }
  const { model } = OBJECT_DEFS[row.object];
  const path = `custom.${row.key}`;
  const cleared = await model.updateMany({ [path]: { $exists: true } }, { $unset: { [path]: 1 } });
  await CrmPropertyModel.deleteOne({ _id: row._id });
  await recordAudit(ctx, {
    action: 'DELETE',
    module: AUDIT_MODULE,
    entityId: row._id,
    entityLabel: row.label,
    summary: `Deleted the ${OBJECT_DEFS[row.object].module} property "${row.label}" and its values on ${cleared.modifiedCount} records`,
  });
  return true;
}
