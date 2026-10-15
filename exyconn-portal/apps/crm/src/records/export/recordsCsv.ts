import { formatISO } from 'date-fns';
import type { CsvColumn } from '@exyconn/shell/utils/csv';
import {
  displayValue,
  valueOf,
  type CrmPropertyInfo,
  type CrmRecordRow,
  type ValueFormatters,
} from '../schema';
import { propertyLabel, type Translate } from '../propertyText';

/** `2026-10-15` from a stored calendar date, so the file imports back on the same day. */
function isoDate(value: string | Date): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return formatISO(value, { representation: 'date' });
}

/**
 * Cells the importer reads back unchanged: option labels, ISO dates, plain numbers and
 * Yes/No — the importer's own words, so they are not translated.
 */
const EXPORT_FORMATTERS: ValueFormatters = {
  formatDate: isoDate,
  formatNumber: String,
  yes: 'Yes',
  no: 'No',
};

/** The properties to export, in order: the given keys, or every property when there are none. */
export function exportProperties(
  properties: readonly CrmPropertyInfo[],
  keys: readonly string[],
): CrmPropertyInfo[] {
  if (keys.length === 0) {
    return [...properties];
  }
  const byKey = new Map(properties.map((property) => [property.key, property]));
  return keys.flatMap((key) => byKey.get(key) ?? []);
}

/** One CSV column per property, headed by its label. */
export function recordColumns(
  properties: readonly CrmPropertyInfo[],
  t: Translate,
): CsvColumn<CrmRecordRow>[] {
  return properties.map((property) => ({
    header: propertyLabel(t, property),
    value: (row) => displayValue(property, valueOf(row, property), EXPORT_FORMATTERS),
  }));
}
