import type { CrmPropertyInfo } from '../schema';
import { propertyLabel, type Translate } from '../propertyText';
import { HEADER_SYNONYMS } from './synonyms';

/** For each CSV column, the property key it imports into, or null when it is not imported. */
export type ColumnMapping = (string | null)[];

/** A cell value as the server receives it: property key to the trimmed cell text. */
export type ImportRow = Record<string, string>;

const NON_ALPHANUMERIC = /[\W_]/g;

/** `E-mail Address` and `email_address` both read `emailaddress`. */
export function normaliseHeader(text: string): string {
  return text.toLowerCase().replaceAll(NON_ALPHANUMERIC, '');
}

/** The properties a file may fill: only these keys may be sent to the importer. */
export function importableProperties(properties: readonly CrmPropertyInfo[]): CrmPropertyInfo[] {
  return properties.filter((property) => property.importable);
}

/** Every normalised name a property answers to: its key, its label and its translated label. */
function namesOf(t: Translate, property: CrmPropertyInfo): string[] {
  return [property.key, property.label, propertyLabel(t, property)].map(normaliseHeader);
}

function matchHeader(
  header: string,
  properties: readonly CrmPropertyInfo[],
  t: Translate,
): string | null {
  const name = normaliseHeader(header);
  if (name === '') {
    return null;
  }
  const direct = properties.find((property) => namesOf(t, property).includes(name));
  if (direct) {
    return direct.key;
  }
  const synonym = HEADER_SYNONYMS[name];
  return properties.some((property) => property.key === synonym) ? synonym : null;
}

/** A first guess at the mapping; a property is given to the first column that matches it. */
export function autoMap(
  headers: readonly string[],
  properties: readonly CrmPropertyInfo[],
  t: Translate,
): ColumnMapping {
  const taken = new Set<string>();
  return headers.map((header) => {
    const key = matchHeader(header, properties, t);
    if (key === null || taken.has(key)) {
      return null;
    }
    taken.add(key);
    return key;
  });
}

/** Maps one column; a property can only be filled by one column, so any other loses it. */
export function assignColumn(
  mapping: ColumnMapping,
  column: number,
  key: string | null,
): ColumnMapping {
  return mapping.map((current, index) => {
    if (index === column) {
      return key;
    }
    return key !== null && current === key ? null : current;
  });
}

/** Required properties no column fills yet; the import cannot start until this is empty. */
export function unmappedRequired(
  mapping: ColumnMapping,
  properties: readonly CrmPropertyInfo[],
): CrmPropertyInfo[] {
  const mapped = new Set(mapping);
  return properties.filter((property) => property.required && !mapped.has(property.key));
}

/** The first few non-empty values of a column, so a person can tell what it holds. */
export function sampleValues(rows: readonly string[][], column: number, count = 3): string[] {
  const samples: string[] = [];
  for (const row of rows) {
    const value = row[column]?.trim() ?? '';
    if (value !== '') {
      samples.push(value);
    }
    if (samples.length === count) {
      break;
    }
  }
  return samples;
}

/** A data row as the importer takes it: mapped columns only, trimmed, blank cells left out. */
export function buildRow(cells: readonly string[], mapping: ColumnMapping): ImportRow {
  const row: ImportRow = {};
  mapping.forEach((key, column) => {
    const value = cells[column]?.trim() ?? '';
    if (key !== null && value !== '') {
      row[key] = value;
    }
  });
  return row;
}
