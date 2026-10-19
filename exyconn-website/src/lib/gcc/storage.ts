import { estimateSchema, type Estimate } from "@exyconn/gcc-cost";
import { z } from "zod";

/**
 * Estimates saved in this browser (localStorage). Nothing here is synchronised anywhere:
 * clearing site data or switching device loses them, which the calculator says plainly and
 * offers JSON export for.
 *
 * Layout, storage schema version 1:
 * - `exyconn.gcc.v1.index`        → { version: 1, activeId, entries: [{ id, name, updatedAt }] }
 * - `exyconn.gcc.v1.estimate.<id>` → the estimate (schema-validated on every read)
 * - `exyconn.gcc.v1.backup.<id>`   → the estimate as it was before an import replaced it
 *
 * Each estimate has its own key so a write can never overwrite a different estimate, and a write
 * is refused when the stored copy changed since this tab last read or wrote it (another tab).
 */
export const STORAGE_VERSION = 1;
const PREFIX = `exyconn.gcc.v${STORAGE_VERSION}`;
const INDEX_KEY = `${PREFIX}.index`;
export const estimateKey = (id: string) => `${PREFIX}.estimate.${id}`;
const backupKey = (id: string) => `${PREFIX}.backup.${id}`;

const indexSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  activeId: z.string().nullable(),
  entries: z.array(z.object({ id: z.string(), name: z.string(), updatedAt: z.string() })),
});
export type StorageIndex = z.infer<typeof indexSchema>;
export type IndexEntry = StorageIndex["entries"][number];

export type StorageFailure = "unavailable" | "quota" | "conflict";
export type WriteResult = { ok: true } | { ok: false; reason: StorageFailure };
export type ReadResult =
  { ok: true; estimate: Estimate } | { ok: false; reason: "missing" | "corrupt" | "unavailable" };

const EMPTY_INDEX: StorageIndex = { version: STORAGE_VERSION, activeId: null, entries: [] };

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const isQuotaError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");

function write(key: string, value: unknown): WriteResult {
  const store = storage();
  if (!store) {
    return { ok: false, reason: "unavailable" };
  }
  try {
    store.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    console.error("GCC calculator: saving to this browser failed", error);
    return { ok: false, reason: isQuotaError(error) ? "quota" : "unavailable" };
  }
}

function readJson(key: string): unknown {
  const raw = storage()?.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

/** The index, or an empty one when nothing (or something unreadable) is stored. */
export function readIndex(): StorageIndex {
  try {
    const parsed = indexSchema.safeParse(readJson(INDEX_KEY));
    return parsed.success ? parsed.data : EMPTY_INDEX;
  } catch {
    return EMPTY_INDEX;
  }
}

export function readEstimate(id: string): ReadResult {
  if (!storage()) {
    return { ok: false, reason: "unavailable" };
  }
  try {
    const value = readJson(estimateKey(id));
    if (value === null) {
      return { ok: false, reason: "missing" };
    }
    const parsed = estimateSchema.safeParse(value);
    return parsed.success ? { ok: true, estimate: parsed.data } : { ok: false, reason: "corrupt" };
  } catch {
    return { ok: false, reason: "corrupt" };
  }
}

const entryOf = (estimate: Estimate): IndexEntry => ({
  id: estimate.id,
  name: estimate.name,
  updatedAt: estimate.updatedAt,
});

/** Puts the estimate first in the index and makes it the active one. */
function upsertIndex(estimate: Estimate): WriteResult {
  const index = readIndex();
  const others = index.entries.filter((entry) => entry.id !== estimate.id);
  return write(INDEX_KEY, {
    ...index,
    activeId: estimate.id,
    entries: [entryOf(estimate), ...others],
  });
}

/**
 * Saves an estimate under its own key. `expectedUpdatedAt` is the `updatedAt` this tab last read
 * or wrote (null for a new estimate); if the stored copy moved on since, nothing is written.
 */
export function saveEstimate(estimate: Estimate, expectedUpdatedAt: string | null): WriteResult {
  const current = readEstimate(estimate.id);
  if (current.ok && current.estimate.updatedAt !== expectedUpdatedAt) {
    return { ok: false, reason: "conflict" };
  }
  const saved = write(estimateKey(estimate.id), estimate);
  return saved.ok ? upsertIndex(estimate) : saved;
}

export function setActive(id: string): WriteResult {
  return write(INDEX_KEY, { ...readIndex(), activeId: id });
}

export function removeEstimate(id: string): WriteResult {
  const store = storage();
  if (!store) {
    return { ok: false, reason: "unavailable" };
  }
  const index = readIndex();
  const entries = index.entries.filter((entry) => entry.id !== id);
  const activeId = index.activeId === id ? (entries[0]?.id ?? null) : index.activeId;
  store.removeItem(estimateKey(id));
  store.removeItem(backupKey(id));
  return write(INDEX_KEY, { ...index, activeId, entries });
}

/** Keeps the stored copy of an estimate before an import replaces it. */
export function backupEstimate(estimate: Estimate): WriteResult {
  return write(backupKey(estimate.id), estimate);
}

export function readBackup(id: string): Estimate | null {
  try {
    const parsed = estimateSchema.safeParse(readJson(backupKey(id)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
