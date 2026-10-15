import { badRequest } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { CompanyModel } from '../company.model';
import { OBJECT_DEFS, type CrmObject, type PropertyDef } from './crm.objects';
import { objectProperties } from './crm.schema';
import { coerceValue } from './crm.values';

/**
 * One chunk of a CSV import, already mapped by the wizard to property keys. Rows are checked
 * one by one so a bad row is reported with its line number and never stops the others; a row
 * that names an existing record (same email, or same domain for a company) is created, updated
 * or skipped as the import's mode says. A blank cell never erases a stored value.
 */
export const IMPORT_MODES = ['CREATE', 'UPDATE', 'UPSERT'] as const;
export type ImportMode = (typeof IMPORT_MODES)[number];
export const MAX_IMPORT_ROWS = 500;

export interface ImportInput {
  object: CrmObject;
  mode: ImportMode;
  rows: unknown[];
  /** The file line of the first row, so every issue names the line a person can find. */
  firstRowNumber: number;
}

export interface ImportIssue {
  row: number;
  message: string;
  /** A row left alone on purpose (already exists, nothing to update) rather than a bad one. */
  skipped: boolean;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  issues: ImportIssue[];
}

interface ParsedRow {
  row: number;
  key: string;
  /** Document paths to their values: `email`, `custom.tier`. Blank cells are absent. */
  values: Record<string, unknown>;
}

type Outcome = 'created' | 'updated' | ImportIssue;

const COLLATION = { locale: 'en', strength: 2 } as const;

function parseRow(
  raw: unknown,
  row: number,
  importable: Map<string, PropertyDef>,
  dedupe: PropertyDef,
): ParsedRow | ImportIssue {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { row, message: 'The row could not be read', skipped: false };
  }
  const values: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const [key, cell] of Object.entries(raw)) {
    const property = importable.get(key);
    if (!property) {
      badRequest(`"${key}" is not a property that can be imported`);
    }
    const result = coerceValue(property, cell);
    if (!result.ok) {
      errors.push(result.error);
    } else if (result.value !== null) {
      values[property.path] = result.value;
    }
  }
  if (errors.length > 0) {
    return { row, message: errors.join('; '), skipped: false };
  }
  const key = values[dedupe.path];
  if (typeof key !== 'string') {
    return { row, message: `${dedupe.label} is required`, skipped: false };
  }
  return { row, key, values };
}

/** What a new record still lacks: required properties without a value. */
function missingRequired(properties: PropertyDef[], values: Record<string, unknown>): string[] {
  return properties
    .filter((p) => p.required && p.importable && values[p.path] === undefined)
    .map((p) => p.label);
}

/** Creation defaults the CSV need not carry: the importer owns it, a lead is worth 0. */
function withDefaults(object: CrmObject, values: Record<string, unknown>, owner: string) {
  const doc: Record<string, unknown> = { owner, ...(object === 'LEAD' ? { value: 0 } : {}) };
  for (const [path, value] of Object.entries(values)) {
    if (path.startsWith('custom.')) {
      doc.custom = { ...(doc.custom as object), [path.slice(7)]: value };
    } else {
      doc[path] = value;
    }
  }
  return doc;
}

/** Links each contact row to the company of the name it gives, and uses that company's name. */
async function linkCompanies(rows: ParsedRow[]): Promise<void> {
  const names = [...new Set(rows.map((r) => r.values.companyName).filter(Boolean))];
  if (names.length === 0) {
    return;
  }
  const companies = await CompanyModel.find({ name: { $in: names } })
    .collation(COLLATION)
    .select('name')
    .lean();
  const byName = new Map(companies.map((c) => [c.name.toLowerCase(), c]));
  for (const row of rows) {
    const company = byName.get(String(row.values.companyName ?? '').toLowerCase());
    if (company) {
      row.values.companyId = company._id.toHexString();
      row.values.companyName = company.name;
    }
  }
}

async function existingIds(object: CrmObject, keys: string[]): Promise<Map<string, unknown>> {
  const { model, dedupeKey } = OBJECT_DEFS[object];
  const found = (await model
    .find({ [dedupeKey]: { $in: keys } })
    .sort({ createdAt: 1 })
    .select(`_id ${dedupeKey}`)
    .lean()) as unknown as Record<string, unknown>[];
  const ids = new Map<string, unknown>();
  for (const doc of found) {
    const key = String(doc[dedupeKey]);
    if (!ids.has(key)) {
      ids.set(key, doc._id);
    }
  }
  return ids;
}

interface Plan {
  input: ImportInput;
  properties: PropertyDef[];
  owner: string;
  existing: Map<string, unknown>;
}

async function applyRow(plan: Plan, row: ParsedRow): Promise<Outcome> {
  const { object, mode } = plan.input;
  const { model, dedupeKey } = OBJECT_DEFS[object];
  const id = plan.existing.get(row.key);
  if (id !== undefined) {
    if (mode === 'CREATE') {
      return {
        row: row.row,
        message: `A record with ${dedupeKey} ${row.key} already exists`,
        skipped: true,
      };
    }
    await model.updateOne({ _id: id }, { $set: row.values }, { runValidators: true });
    return 'updated';
  }
  if (mode === 'UPDATE') {
    return {
      row: row.row,
      message: `No record with ${dedupeKey} ${row.key} to update`,
      skipped: true,
    };
  }
  const missing = missingRequired(plan.properties, row.values);
  if (missing.length > 0) {
    return { row: row.row, message: `Missing ${missing.join(', ')}`, skipped: false };
  }
  await model.create(withDefaults(object, row.values, plan.owner));
  return 'created';
}

/** The error a person can act on, from whatever the database said. */
function failure(row: number, error: unknown): ImportIssue {
  const duplicate = (error as { code?: number }).code === 11000;
  if (!duplicate) {
    logger.warn(
      { err: error instanceof Error ? error.message : error, row },
      'CRM import row failed',
    );
  }
  const message = duplicate
    ? 'Another row created this record a moment ago'
    : (error as Error).message || 'The row could not be saved';
  return { row, message, skipped: false };
}

export async function importRecords(input: ImportInput, owner: string): Promise<ImportResult> {
  if (input.rows.length === 0 || input.rows.length > MAX_IMPORT_ROWS) {
    badRequest(`Send between 1 and ${MAX_IMPORT_ROWS} rows at a time`);
  }
  const properties = await objectProperties(input.object);
  const importable = new Map(properties.filter((p) => p.importable).map((p) => [p.key, p]));
  const dedupe = importable.get(OBJECT_DEFS[input.object].dedupeKey) as PropertyDef;
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, issues: [] };
  const firstLine = new Map<string, number>();
  const rows: ParsedRow[] = [];
  input.rows.forEach((raw, index) => {
    const parsed = parseRow(raw, input.firstRowNumber + index, importable, dedupe);
    if (!('key' in parsed)) {
      result.issues.push(parsed);
      return;
    }
    const earlier = firstLine.get(parsed.key);
    if (earlier === undefined) {
      firstLine.set(parsed.key, parsed.row);
      rows.push(parsed);
    } else {
      result.issues.push({
        row: parsed.row,
        message: `Same ${dedupe.label.toLowerCase()} as row ${earlier}`,
        skipped: true,
      });
    }
  });
  if (input.object === 'CONTACT') {
    await linkCompanies(rows);
  }
  const plan: Plan = {
    input,
    properties,
    owner,
    existing: await existingIds(
      input.object,
      rows.map((r) => r.key),
    ),
  };
  for (const row of rows) {
    const outcome = await applyRow(plan, row).catch((error: unknown) => failure(row.row, error));
    if (typeof outcome === 'string') {
      result[outcome] += 1;
    } else {
      result.issues.push(outcome);
    }
  }
  result.skipped = result.issues.filter((issue) => issue.skipped).length;
  result.issues.sort((a, b) => a.row - b.row);
  return result;
}
