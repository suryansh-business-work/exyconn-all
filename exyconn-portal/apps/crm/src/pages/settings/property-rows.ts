import { CrmPropertyType } from '@exyconn/shell/graphql/generated';
import type { CrmPropertyInfo } from '../../records/schema';
import type { CrmPropertyRow } from './forms/crm-property';

/** One line of the properties table: a custom property, or a built-in one shown read-only. */
export interface PropertyTableRow {
  id: string;
  key: string;
  label: string;
  type: CrmPropertyType;
  required: boolean;
  /** How many choices a dropdown offers; null for every other type. */
  choices: number | null;
  description: string;
  /** The saved custom property behind the row; null on a built-in one. */
  property: CrmPropertyRow | null;
}

const choicesOf = (type: CrmPropertyType, options: readonly unknown[]) =>
  type === CrmPropertyType.Enum ? options.length : null;

const fromCustom = (property: CrmPropertyRow): PropertyTableRow => ({
  id: property.id,
  key: property.key,
  label: property.label,
  type: property.type,
  required: property.required,
  choices: choicesOf(property.type, property.options),
  description: property.description,
  property,
});

const fromBuiltIn = (property: CrmPropertyInfo): PropertyTableRow => ({
  // Built-in properties have no id of their own; their key is unique within the record type.
  id: `built-in:${property.key}`,
  key: property.key,
  label: property.label,
  type: property.type,
  required: property.required,
  choices: choicesOf(property.type, property.options),
  description: property.description,
  property: null,
});

/** The company's own properties first, in their order, then the ones the CRM comes with. */
export function propertyTableRows(
  custom: readonly CrmPropertyRow[],
  schema: readonly CrmPropertyInfo[],
): PropertyTableRow[] {
  const builtIn = schema.filter((property) => property.builtIn);
  return [...custom.map(fromCustom), ...builtIn.map(fromBuiltIn)];
}

/** The keys a new property cannot take. */
export const builtInKeysOf = (schema: readonly CrmPropertyInfo[]): ReadonlySet<string> =>
  new Set(schema.filter((property) => property.builtIn).map((property) => property.key));
