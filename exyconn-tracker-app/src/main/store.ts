import { app, safeStorage } from 'electron';
import type { AppPreferences } from '@shared/types';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

interface PersistedState {
  /** Encrypted device token (base64 of safeStorage ciphertext). Never stored in plaintext. */
  encryptedToken: string | null;
  /** Stable per-install device id, generated once. */
  deviceId: string;
  /** This install's own preferences. Absent in state files written before they existed. */
  preferences?: Partial<AppPreferences>;
}

/**
 * Tray-first by default, and following the OS's own light/dark choice until the employee
 * says otherwise. The app is built to sit in the tray and keep tracking, and a stray click on
 * the close button should not quietly end somebody's working day.
 */
const DEFAULT_PREFERENCES: AppPreferences = { closeToTray: true, themeMode: 'system' };

/**
 * Persists the non-expiring device token, encrypted at rest with the OS keychain
 * (Keychain on macOS, DPAPI on Windows) via Electron safeStorage. safeStorage is only
 * available after `app.whenReady()`, so every method here assumes the app is ready.
 */
class SecureStore {
  private readonly file = join(app.getPath('userData'), 'tracker-state.json');
  private state: PersistedState;
  /** Set only when "Remember me" was unchecked — never written to disk. */
  private sessionToken: string | null = null;

  constructor() {
    this.state = this.load();
  }

  private load(): PersistedState {
    if (existsSync(this.file)) {
      try {
        return JSON.parse(readFileSync(this.file, 'utf-8')) as PersistedState;
      } catch {
        // Corrupt state file — start fresh rather than crash on launch.
      }
    }
    return { encryptedToken: null, deviceId: randomUUID(), preferences: DEFAULT_PREFERENCES };
  }

  private persist(): void {
    mkdirSync(app.getPath('userData'), { recursive: true });
    writeFileSync(this.file, JSON.stringify(this.state), 'utf-8');
  }

  get deviceId(): string {
    return this.state.deviceId;
  }

  /** True when a remembered session is on disk (drives the login screen's checkbox). */
  get remembered(): boolean {
    return Boolean(this.state.encryptedToken);
  }

  /**
   * The active token. A remembered session is decrypted from disk; a session-only sign-in
   * lives purely in memory, so quitting the app signs the employee out.
   */
  getToken(): string | null {
    if (this.sessionToken) {
      return this.sessionToken;
    }
    if (!this.state.encryptedToken || !safeStorage.isEncryptionAvailable()) {
      return null;
    }
    try {
      return safeStorage.decryptString(Buffer.from(this.state.encryptedToken, 'base64'));
    } catch {
      return null;
    }
  }

  /**
   * Stores the sign-in. With `remember`, the non-expiring device token is encrypted at rest
   * via the OS keychain (Keychain / DPAPI) and survives restarts until an explicit logout.
   * Without it, the token is held in memory only and is gone when the process exits.
   */
  setToken(token: string, remember: boolean): void {
    if (!remember) {
      this.sessionToken = token;
      this.state.encryptedToken = null;
      this.persist();
      return;
    }
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('OS secure storage is unavailable; cannot remember this sign-in.');
    }
    this.sessionToken = null;
    this.state.encryptedToken = safeStorage.encryptString(token).toString('base64');
    this.persist();
  }

  /**
   * This install's preferences, with defaults filled in — a state file written before a
   * preference existed comes back without it, and the renderer needs a whole object.
   */
  get preferences(): AppPreferences {
    return { ...DEFAULT_PREFERENCES, ...this.state.preferences };
  }

  /** Merges a partial update, so a caller never has to restate preferences it did not touch. */
  setPreferences(update: Partial<AppPreferences>): AppPreferences {
    this.state.preferences = { ...this.preferences, ...update };
    this.persist();
    return this.preferences;
  }

  clearToken(): void {
    this.sessionToken = null;
    this.state.encryptedToken = null;
    this.persist();
  }
}

let instance: SecureStore | null = null;

/** Lazily builds the store after the app is ready (safeStorage requirement). */
export function secureStore(): SecureStore {
  instance ??= new SecureStore();
  return instance;
}
