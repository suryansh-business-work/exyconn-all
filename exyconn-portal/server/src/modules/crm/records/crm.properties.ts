import { recordAudit } from '../../audit';
import { badRequest, notFound } from '../../../utils/errors';
import type { GraphQLContext } from '../../../middleware/auth';
import { CrmPropertyModel } from './crm-property.model';
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

export async function createProperty(ctx: GraphQLContext, input: CrmPropertyInput) {
  const key = input.key.trim();
  if (!isPropertyKey(key)) {
    badRequest('The key starts with a letter and uses lowercase letters, digits and _ (up to 40)');
  }
  if (isBuiltInKey(input.object, key)) {
    badRequest(`"${key}" is already a built-in property`);
  }
  const count = await CrmPropertyModel.countDocuments({ object: input.object });
  if (count >= MAX_PER_OBJECT) {
    badRequest(`Up to ${MAX_PER_OBJECT} properties per record type`);
  }
  if (await CrmPropertyModel.exists({ object: input.object, key })) {
    badRequest(`A property with the key "${key}" already exists`);
  }
  const row = await CrmPropertyModel.create({
    object: input.object,
    key,
    type: input.type,
    options: cleanOptions(input.type, input.options),
    order: count,
    ...cleanText(input),
  });
  await recordAudit(ctx, {
    action: 'CREATE',
    module: AUDIT_MODULE,
    entityId: row._id,
    entityLabel: row.label,
    summary: `Added the ${OBJECT_DEFS[input.object].module} property "${row.label}" (${row.type})`,
  });
  return present(row.toObject() as unknown as PropertyRow);
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
  return present(row as unknown as PropertyRow);
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
