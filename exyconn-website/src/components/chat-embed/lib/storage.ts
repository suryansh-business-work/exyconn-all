import type { ChatSite } from "../types";

/**
 * localStorage, which a private window, blocked third-party site data or a sandboxed frame may
 * refuse: every access is guarded, and a refusal only costs the visitor a remembered value.
 */
export function readItem(key: string): string | null {
  try {
    return globalThis.localStorage.getItem(key);
  } catch (error) {
    console.warn("[chat] could not read", key, error);
    return null;
  }
}

export function writeItem(key: string, value: string): void {
  try {
    globalThis.localStorage.setItem(key, value);
  } catch (error) {
    console.warn("[chat] could not save", key, error);
  }
}

export function removeItem(key: string): void {
  try {
    globalThis.localStorage.removeItem(key);
  } catch (error) {
    console.warn("[chat] could not forget", key, error);
  }
}

export interface StorageKeys {
  token: string;
  sound: string;
}

/** The keys one site's chat keeps: its chat pass and the sound preference. */
export function storageKeys(site: ChatSite): Readonly<StorageKeys> {
  return { token: `exyconn-chat:${site}:token`, sound: `exyconn-chat:${site}:sound` };
}
