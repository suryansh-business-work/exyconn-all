import type { ImportFieldOption, ImportRow } from './import.types';

/** For each file column, the field key it imports into, or null when it is not imported. */
export type ColumnMapping = (string | null)[];

const NON_ALPHANUMERIC = /[\W_]/g;

/** `E-mail Address` and `email_address` both read `emailaddress`. */
export function normaliseHeader(text: string): string {
  return text.toLowerCase().replaceAll(NON_ALPHANUMERIC, '');
}

/** Every normalised name a field answers to: its key, its label and its aliases. */
function namesOf(field: ImportFieldOption): string[] {
  return [field.key, field.label, ...(field.aliases ?? [])].map(normaliseHeader);
}

function matchHeader(
  header: string,
  fields: readonly ImportFieldOption[],
  synonyms: Readonly<Record<string, string>>,
): string | null {
  const name = normaliseHeader(header);
  if (name === '') {
    return null;
  }
  const direct = fields.find((field) => namesOf(field).includes(name));
  if (direct) {
    return direct.key;
  }
  const synonym = synonyms[name];
  return fields.some((field) => field.key === synonym) ? synonym : null;
}

/** A first guess at the mapping; a field is given to the first column that matches it. */
export function autoMap(
  headers: readonly string[],
  fields: readonly ImportFieldOption[],
  synonyms: Readonly<Record<string, string>> = {},
): ColumnMapping {
  const taken = new Set<string>();
  return headers.map((header) => {
    const key = matchHeader(header, fields, synonyms);
    if (key === null || taken.has(key)) {
      return null;
    }
    taken.add(key);
    return key;
  });
}

/** Maps one column; a field can only be filled by one column, so any other loses it. */
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

/** Required fields no column fills yet; the import cannot start until this is empty. */
export function unmappedRequired(
  mapping: ColumnMapping,
  fields: readonly ImportFieldOption[],
): ImportFieldOption[] {
  const mapped = new Set(mapping);
  return fields.filter((field) => field.required && !mapped.has(field.key));
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
