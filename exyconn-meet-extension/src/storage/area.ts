/**
 * The slice of `chrome.storage.StorageArea` this extension uses — small enough to fake in a
 * unit test, and satisfied by `chrome.storage.session`, `.local` and `.sync` as they are.
 */
export interface KeyValueArea {
  get(keys: string | string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

/** One key in one area, read and written as a whole value. */
export interface Slot<T> {
  read(): Promise<T | null>;
  write(value: T): Promise<void>;
  clear(): Promise<void>;
}

/**
 * A typed key. `parse` turns whatever is stored (possibly written by an older version) into
 * a value or null, so a stale or corrupt entry reads as "nothing stored", never as a crash.
 */
export function createSlot<T>(
  area: KeyValueArea,
  key: string,
  parse: (raw: unknown) => T | null,
): Slot<T> {
  return {
    async read() {
      const stored = await area.get(key);
      return key in stored ? parse(stored[key]) : null;
    },
    write: (value) => area.set({ [key]: value }),
    clear: () => area.remove(key),
  };
}

/** True for a plain object (not null, not an array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
