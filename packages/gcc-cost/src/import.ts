import { LIMITS } from './limits';
import type { z } from 'zod';
import {
  EXPORT_FORMAT,
  estimateSchema,
  exportFileSchema,
  SCHEMA_VERSION,
  type Estimate,
  type ExportFile,
} from './schema';

export type ImportFailure =
  | { ok: false; reason: 'too-large'; message: string }
  | { ok: false; reason: 'syntax'; message: string }
  | { ok: false; reason: 'format'; message: string }
  | { ok: false; reason: 'version'; message: string }
  | { ok: false; reason: 'invalid'; message: string; issues: string[] };

export type ImportResult = { ok: true; file: ExportFile } | ImportFailure;

export type EstimateJsonResult = { ok: true; estimate: Estimate } | ImportFailure;

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** JSON.parse reviver that refuses prototype-polluting keys anywhere in the document. */
function guardedReviver(key: string, value: unknown): unknown {
  if (FORBIDDEN_KEYS.has(key)) {
    throw new SyntaxError(`Key "${key}" is not allowed`);
  }
  return value;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Reads an exported estimate file. Checks, in order: size, JSON syntax (refusing prototype keys),
 * the file format, the schema version (with an explanation for a newer or older one), then the
 * full schema. Totals are never read from the file — the caller recomputes from the inputs.
 */
export function parseEstimateFile(text: string): ImportResult {
  const read = readJson(text);
  if (!read.ok) {
    return read;
  }
  const { data } = read;
  if (!isRecord(data) || data.format !== EXPORT_FORMAT) {
    return { ok: false, reason: 'format', message: 'This is not an Exyconn GCC estimate file.' };
  }
  if (data.schemaVersion !== SCHEMA_VERSION) {
    return {
      ok: false,
      reason: 'version',
      message: `The file uses estimate schema version ${String(data.schemaVersion)}; this calculator reads version ${SCHEMA_VERSION}. Export it again from a calculator on the same version.`,
    };
  }
  const parsed = exportFileSchema.safeParse(data);
  if (!parsed.success) {
    return invalid('The file does not match the estimate schema.', parsed.error);
  }
  return { ok: true, file: parsed.data };
}

/**
 * Reads a bare estimate (no export envelope) — what the website sends the server to email or
 * share. Same size and prototype-key guards as {@link parseEstimateFile}, then the full schema.
 */
export function parseEstimateJson(text: string): EstimateJsonResult {
  const read = readJson(text);
  if (!read.ok) {
    return read;
  }
  const parsed = estimateSchema.safeParse(read.data);
  if (!parsed.success) {
    return invalid('The estimate does not match the estimate schema.', parsed.error);
  }
  return { ok: true, estimate: parsed.data };
}

/** Size, then JSON syntax with prototype-polluting keys refused. */
function readJson(text: string): { ok: true; data: unknown } | ImportFailure {
  if (new TextEncoder().encode(text).length > LIMITS.payloadBytes) {
    return {
      ok: false,
      reason: 'too-large',
      message: `The file is larger than ${LIMITS.payloadBytes / 1_000_000} MB.`,
    };
  }
  try {
    return { ok: true, data: JSON.parse(text, guardedReviver) };
  } catch (error) {
    return { ok: false, reason: 'syntax', message: (error as Error).message };
  }
}

function invalid(message: string, error: z.ZodError): ImportFailure {
  return {
    ok: false,
    reason: 'invalid',
    message,
    issues: error.issues
      .slice(0, 20)
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
  };
}

export function toExportFile(estimate: Estimate, exportedAt: string): ExportFile {
  return { format: EXPORT_FORMAT, schemaVersion: SCHEMA_VERSION, exportedAt, estimate };
}

/** A short preview shown before an import is applied. */
export interface ImportPreview {
  name: string;
  updatedAt: string;
  reportingCurrency: string;
  scenarioCount: number;
  itemCount: number;
}

export function previewImport(estimate: Estimate): ImportPreview {
  return {
    name: estimate.name,
    updatedAt: estimate.updatedAt,
    reportingCurrency: estimate.reportingCurrency,
    scenarioCount: estimate.scenarios.length,
    itemCount: estimate.scenarios.reduce(
      (total, scenario) =>
        total +
        scenario.roles.length +
        scenario.lines.length +
        scenario.ai.subscriptions.length +
        scenario.ai.usage.length,
      0,
    ),
  };
}
