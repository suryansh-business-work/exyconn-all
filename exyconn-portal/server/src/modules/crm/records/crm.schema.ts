import { CrmPropertyModel } from './crm-property.model';
import { OBJECT_DEFS, type CrmObject, type PropertyDef, type PropertyType } from './crm.objects';

/**
 * What a condition may ask of a property, by its type — HubSpot's operator lists. The filter
 * builder offers exactly these, and the query compiler (crm.query) refuses anything else.
 */
export const CRM_OPS = [
  'EQ',
  'NEQ',
  'CONTAINS',
  'NOT_CONTAINS',
  'STARTS_WITH',
  'ENDS_WITH',
  'GT',
  'GTE',
  'LT',
  'LTE',
  'BETWEEN',
  'IN',
  'NOT_IN',
  'BEFORE',
  'AFTER',
  'LAST_DAYS',
  'IS_EMPTY',
  'IS_NOT_EMPTY',
] as const;
export type CrmOp = (typeof CRM_OPS)[number];

const TEXT_OPS: readonly CrmOp[] = [
  'CONTAINS',
  'NOT_CONTAINS',
  'EQ',
  'NEQ',
  'STARTS_WITH',
  'ENDS_WITH',
  'IS_EMPTY',
  'IS_NOT_EMPTY',
];

export const OPS_BY_TYPE: Readonly<Record<PropertyType, readonly CrmOp[]>> = {
  TEXT: TEXT_OPS,
  TEXTAREA: TEXT_OPS,
  EMAIL: TEXT_OPS,
  PHONE: TEXT_OPS,
  URL: TEXT_OPS,
  NUMBER: ['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'BETWEEN', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  DATE: ['BEFORE', 'AFTER', 'BETWEEN', 'LAST_DAYS', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  ENUM: ['IN', 'NOT_IN', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  RADIO: ['IN', 'NOT_IN', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  /** IN: has any of the chosen; NOT_IN: has none of them. */
  MULTI_SELECT: ['IN', 'NOT_IN', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  BOOLEAN: ['EQ', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  FILE: ['IS_EMPTY', 'IS_NOT_EMPTY'],
};

/** A filter-only Yes/No property is asked one thing: is it Yes or No. */
const PRESENCE_OPS: readonly CrmOp[] = ['EQ'];

/** The operators a property takes. */
export const opsOf = (property: PropertyDef): readonly CrmOp[] =>
  property.filterOnly ? PRESENCE_OPS : OPS_BY_TYPE[property.type];

/** A company's custom properties for one object, in their display order. */
export async function customProperties(object: CrmObject): Promise<PropertyDef[]> {
  const rows = await CrmPropertyModel.find({ object }).sort({ order: 1, createdAt: 1 }).lean();
  return rows.map((row) => ({
    key: row.key,
    label: row.label,
    type: row.type,
    options: (row.options ?? []).map(({ value, label }) => ({ value, label })),
    required: row.required,
    builtIn: false,
    path: `custom.${row.key}`,
    importable: true,
    description: row.description ?? '',
    filterOnly: false,
  }));
}

/** Every property of an object: the built-in ones, then the company's own. */
export async function objectProperties(object: CrmObject): Promise<PropertyDef[]> {
  return [...OBJECT_DEFS[object].builtIns, ...(await customProperties(object))];
}

/** The properties by key, for checking a request's property names against. */
export async function propertyIndex(object: CrmObject): Promise<Map<string, PropertyDef>> {
  return new Map((await objectProperties(object)).map((property) => [property.key, property]));
}
