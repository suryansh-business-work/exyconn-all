import type { FilterQuery } from 'mongoose';
import { archivedFilter } from '../../../lib/archivable';
import { badRequest } from '../../../utils/errors';
import { escapeRegex } from '../../../utils/tableQuery';
import { withIds } from '../../../utils/serialize';
import { CHOICE_TYPES, OBJECT_DEFS, type CrmObject, type PropertyDef } from './crm.objects';
import { opsOf, propertyIndex, type CrmOp } from './crm.schema';
import { coerceValue } from './crm.values';

/**
 * A CRM list query the way HubSpot builds one: conditions inside a group must all hold, and a
 * record matches when any group does. Every property and operator is checked against the
 * object's schema, every value is read as its property's type (so 9 > 10 is false and dates
 * compare as dates), and text is escaped before it reaches a regular expression.
 */
export interface CrmCondition {
  property: string;
  op: CrmOp;
  values: string[];
}
export interface CrmFilterGroup {
  conditions: CrmCondition[];
}
export interface CrmSort {
  property: string;
  dir: 'ASC' | 'DESC';
}
export interface CrmQueryInput {
  page: number;
  pageSize: number;
  search?: string | null;
  groups?: CrmFilterGroup[] | null;
  sorts?: CrmSort[] | null;
  archived?: boolean | null;
}

export const CRM_QUERY_LIMITS = Object.freeze({
  maxGroups: 10,
  maxConditions: 20,
  maxValues: 100,
  maxValueLength: 200,
  maxSorts: 3,
  maxPageSize: 200,
  maxSkip: 100_000,
  maxSearch: 100,
  maxLastDays: 3650,
});

const DAY_MS = 86_400_000;
/** The types whose conditions match text, with the text operators. */
const TEXT_TYPES: ReadonlySet<PropertyDef['type']> = new Set(['TEXT', 'EMAIL', 'PHONE', 'URL']);
type Condition = Record<string, unknown>;

const isEmpty = (path: string): Condition => ({
  $or: [{ [path]: { $exists: false } }, { [path]: null }, { [path]: '' }],
});

function first(condition: CrmCondition, label: string): string {
  const value = condition.values[0];
  if (value === undefined || value.trim() === '') {
    badRequest(`Enter a value for ${label}`);
  }
  return value;
}

/** Reads every value as the property's type; one that cannot be read refuses the query. */
function typed(property: PropertyDef, values: string[]): unknown[] {
  // flatMap: a multi-select coerces each filter value to a one-item list.
  return values.flatMap((raw) => {
    const result = coerceValue(property, raw);
    if (!result.ok) {
      badRequest(result.error);
    }
    return result.value;
  });
}

function textCondition(path: string, op: CrmOp, value: string): Condition {
  const escaped = escapeRegex(value.trim());
  const patterns: Partial<Record<CrmOp, RegExp>> = {
    CONTAINS: new RegExp(escaped, 'i'),
    NOT_CONTAINS: new RegExp(escaped, 'i'),
    EQ: new RegExp(`^${escaped}$`, 'i'),
    NEQ: new RegExp(`^${escaped}$`, 'i'),
    STARTS_WITH: new RegExp(`^${escaped}`, 'i'),
    ENDS_WITH: new RegExp(`${escaped}$`, 'i'),
  };
  const pattern = patterns[op] as RegExp;
  return op === 'NOT_CONTAINS' || op === 'NEQ'
    ? { [path]: { $not: pattern } }
    : { [path]: pattern };
}

function between(property: PropertyDef, values: string[]): Condition {
  if (values.length !== 2) {
    badRequest(`${property.label} "between" needs two values`);
  }
  const [from, to] = typed(property, values);
  return { [property.path]: { $gte: from, $lte: to } };
}

function lastDays(property: PropertyDef, value: string): Condition {
  const days = Number.parseInt(value, 10);
  if (!Number.isInteger(days) || days < 1 || days > CRM_QUERY_LIMITS.maxLastDays) {
    badRequest(
      `${property.label}: enter a number of days from 1 to ${CRM_QUERY_LIMITS.maxLastDays}`,
    );
  }
  return { [property.path]: { $gte: new Date(Date.now() - days * DAY_MS) } };
}

const COMPARE: Partial<Record<CrmOp, string>> = {
  EQ: '$eq',
  NEQ: '$ne',
  GT: '$gt',
  GTE: '$gte',
  LT: '$lt',
  LTE: '$lte',
  BEFORE: '$lt',
  AFTER: '$gt',
};

function valueCondition(property: PropertyDef, condition: CrmCondition): Condition {
  const { op, values } = condition;
  const { path, type, label } = property;
  if (CHOICE_TYPES.has(type)) {
    if (values.length === 0) {
      badRequest(`Choose at least one ${label}`);
    }
    return { [path]: { [op === 'IN' ? '$in' : '$nin']: typed(property, values) } };
  }
  if (op === 'BETWEEN') {
    return between(property, values);
  }
  if (op === 'LAST_DAYS') {
    return lastDays(property, first(condition, label));
  }
  const [value] = typed(property, [first(condition, label)]);
  if (type === 'BOOLEAN') {
    return value === true ? { [path]: true } : { [path]: { $ne: true } };
  }
  return { [path]: { [COMPARE[op] as string]: value } };
}

const hasValue = (path: string): Condition => ({ [path]: { $exists: true, $nin: [null, ''] } });

/** "Has email is Yes": any of the property's paths holds a value; "No": none of them does. */
function presenceCondition(paths: string[], condition: CrmCondition, label: string): Condition {
  const wanted = first(condition, label);
  if (wanted !== 'true' && wanted !== 'false') {
    badRequest(`${label} is Yes or No`);
  }
  const present = paths.map(hasValue);
  return wanted === 'true' ? { $or: present } : { $nor: present };
}

function compileCondition(property: PropertyDef, condition: CrmCondition): Condition {
  if (!opsOf(property).includes(condition.op)) {
    badRequest(`${property.label} cannot be filtered with ${condition.op}`);
  }
  if (condition.values.length > CRM_QUERY_LIMITS.maxValues) {
    badRequest(`At most ${CRM_QUERY_LIMITS.maxValues} values in one condition`);
  }
  if (condition.values.some((value) => value.length > CRM_QUERY_LIMITS.maxValueLength)) {
    badRequest(`A filter value is limited to ${CRM_QUERY_LIMITS.maxValueLength} characters`);
  }
  if (property.presencePaths) {
    return presenceCondition(property.presencePaths, condition, property.label);
  }
  if (condition.op === 'IS_EMPTY') {
    return isEmpty(property.path);
  }
  if (condition.op === 'IS_NOT_EMPTY') {
    return hasValue(property.path);
  }
  return TEXT_TYPES.has(property.type)
    ? textCondition(property.path, condition.op, first(condition, property.label))
    : valueCondition(property, condition);
}

function propertyOf(properties: Map<string, PropertyDef>, key: string): PropertyDef {
  const property = properties.get(key);
  if (!property) {
    badRequest(`There is no property "${key}"`);
  }
  return property;
}

/** The Mongo filter for a search box and filter groups. */
export function compileFilter(
  object: CrmObject,
  properties: Map<string, PropertyDef>,
  input: Pick<CrmQueryInput, 'search' | 'groups'>,
): FilterQuery<unknown> {
  const and: Condition[] = [];
  const search = input.search?.trim() ?? '';
  if (search.length > CRM_QUERY_LIMITS.maxSearch) {
    badRequest(`Search is limited to ${CRM_QUERY_LIMITS.maxSearch} characters`);
  }
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    and.push({ $or: OBJECT_DEFS[object].searchPaths.map((path) => ({ [path]: pattern })) });
  }
  const groups = (input.groups ?? []).filter((group) => group.conditions.length > 0);
  if (groups.length > CRM_QUERY_LIMITS.maxGroups) {
    badRequest(`At most ${CRM_QUERY_LIMITS.maxGroups} filter groups`);
  }
  if (groups.some((group) => group.conditions.length > CRM_QUERY_LIMITS.maxConditions)) {
    badRequest(`At most ${CRM_QUERY_LIMITS.maxConditions} conditions in a group`);
  }
  if (groups.length > 0) {
    and.push({
      $or: groups.map((group) => ({
        $and: group.conditions.map((c) => compileCondition(propertyOf(properties, c.property), c)),
      })),
    });
  }
  return and.length > 0 ? { $and: and } : {};
}

/** The sort, newest first when none is asked for; `_id` last keeps pages stable. */
export function compileSort(
  properties: Map<string, PropertyDef>,
  sorts: CrmSort[] | null | undefined,
): Record<string, 1 | -1> {
  const requested = sorts ?? [];
  if (requested.length > CRM_QUERY_LIMITS.maxSorts) {
    badRequest(`At most ${CRM_QUERY_LIMITS.maxSorts} sort columns`);
  }
  const sort: Record<string, 1 | -1> = {};
  for (const { property, dir } of requested) {
    const def = propertyOf(properties, property);
    if (def.filterOnly) {
      badRequest(`${def.label} cannot be sorted on`);
    }
    sort[def.path] = dir === 'DESC' ? -1 : 1;
  }
  if (requested.length === 0) {
    sort.createdAt = -1;
  }
  sort._id = -1;
  return sort;
}

/** Text sorts ignore case, as people expect: "acme" sits beside "Acme". */
const COLLATION = { locale: 'en', strength: 2 } as const;

/** One page of an object's records under a query, with the total it pages through. */
export async function searchRecords(object: CrmObject, input: CrmQueryInput) {
  const pageSize = Math.min(Math.max(Math.trunc(input.pageSize), 1), CRM_QUERY_LIMITS.maxPageSize);
  const skip = Math.max(Math.trunc(input.page), 0) * pageSize;
  if (skip > CRM_QUERY_LIMITS.maxSkip) {
    badRequest('That page is too far in; narrow the search or filters instead');
  }
  const properties = await propertyIndex(object);
  const filter = { ...compileFilter(object, properties, input), ...archivedFilter(input.archived) };
  const { model } = OBJECT_DEFS[object];
  const [rows, totalCount] = await Promise.all([
    model
      .find(filter)
      .collation(COLLATION)
      .sort(compileSort(properties, input.sorts))
      .skip(skip)
      .limit(pageSize)
      .lean(),
    model.countDocuments(filter),
  ]);
  return { rows: withIds(rows as { _id: unknown }[]), totalCount };
}
