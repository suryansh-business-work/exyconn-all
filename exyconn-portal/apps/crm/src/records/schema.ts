import { useMemo } from 'react';
import {
  CrmPropertyType,
  useCrmObjectSchemaQuery,
  type CrmObject,
  type CrmObjectSchemaQuery,
} from '@exyconn/shell/graphql/generated';

/**
 * The CRM records layer on the client: a record type's properties (built-in and the company's
 * custom ones) as the server describes them. Columns, filters, import mapping and export are
 * all built from this, so a new property shows up everywhere without code.
 */
export type CrmPropertyInfo = CrmObjectSchemaQuery['crmObjectSchema']['properties'][number];
/** The types whose values are picked from the property's own choices. */
export const CHOICE_TYPES: ReadonlySet<CrmPropertyType> = new Set([
  CrmPropertyType.Enum,
  CrmPropertyType.Radio,
  CrmPropertyType.MultiSelect,
]);

/** The file name at the end of an uploaded file's address. */
export const fileNameOf = (url: string) => {
  const path = url.split('?')[0];
  return decodeURIComponent(path.slice(path.lastIndexOf('/') + 1));
};

/**
 * The properties a record actually holds: every one but the filter-only Yes/No checks (Has
 * email, Has phone), which are never a column, a sort, an import or export field or a form input.
 */
export const recordFields = (properties: readonly CrmPropertyInfo[]): CrmPropertyInfo[] =>
  properties.filter((property) => !property.filterOnly);

export type CrmRecordRow = Record<string, unknown> & { id: string; custom?: unknown };

/** One record type's properties, cached for the session; refetched when properties change. */
export function useObjectSchema(object: CrmObject) {
  const { data, loading, error, refetch } = useCrmObjectSchemaQuery({
    variables: { object },
    fetchPolicy: 'cache-and-network',
  });
  const schema = data?.crmObjectSchema;
  const all = schema?.properties;
  const properties = useMemo(() => all ?? [], [all]);
  const fields = useMemo(() => recordFields(properties), [properties]);
  return {
    /** Every property, filter-only ones included: what the filter builder offers. */
    properties,
    /** The properties a record holds (see `recordFields`): columns, sorts, import, export, forms. */
    fields,
    dedupeKey: schema?.dedupeKey ?? '',
    loading,
    error,
    refetch,
  };
}

/** A record's stored value for a property: built-in fields on the row, custom ones under `custom`. */
export function valueOf(row: CrmRecordRow, property: CrmPropertyInfo): unknown {
  if (property.builtIn) {
    return row[property.key];
  }
  const custom = (row.custom ?? {}) as Record<string, unknown>;
  return custom[property.key];
}

/** A stored scalar as text; anything structured is written as JSON rather than `[object Object]`. */
export function scalarText(value: unknown): string {
  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    default:
      return JSON.stringify(value) ?? '';
  }
}

/** An option's label for a stored option value, or the value itself when it is no longer listed. */
export function optionLabel(property: CrmPropertyInfo, value: unknown): string {
  const stored = String(value);
  return property.options.find((option) => option.value === stored)?.label ?? stored;
}

export interface ValueFormatters {
  formatDate: (value: string | Date) => string;
  formatNumber: (value: number) => string;
  yes: string;
  no: string;
}

/**
 * How a value reads in a cell or a CSV: option labels, the workspace's date and number formats,
 * Yes/No. Blank values are an empty string. Pass ISO-date formatting for an export so the file
 * imports back unchanged (the importer reads 2026-10-15 and option labels).
 */
export function displayValue(
  property: CrmPropertyInfo,
  value: unknown,
  formatters: ValueFormatters,
): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  switch (property.type) {
    case CrmPropertyType.Enum:
    case CrmPropertyType.Radio:
      return optionLabel(property, value);
    case CrmPropertyType.MultiSelect:
      return (Array.isArray(value) ? value : [value])
        .map((one) => optionLabel(property, one))
        .join(', ');
    case CrmPropertyType.File:
      return fileNameOf(scalarText(value));
    case CrmPropertyType.Boolean:
      return value === true ? formatters.yes : formatters.no;
    case CrmPropertyType.Date:
      return formatters.formatDate(value instanceof Date ? value : scalarText(value));
    case CrmPropertyType.Number:
      return typeof value === 'number' ? formatters.formatNumber(value) : scalarText(value);
    default:
      return scalarText(value);
  }
}
