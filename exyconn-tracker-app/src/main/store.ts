import { app, safeStorage } from 'electron';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

interface PersistedState {
  /** Encrypted device token (base64 of safeStorage ciphertext). Never stored in plaintext. */
  encryptedToken: string | null;
  /** Stable per-install device id, generated once. */
  deviceId: string;
}

/**
 * Persists the non-expiring device token, encrypted at rest with the OS keychain
 * (Keychain on macOS, DPAPI on Windows) via Electron safeStorage. safeStorage is only
 * available after `app.whenReady()`, so every method here assumes the app is ready.
 */
class SecureStore {
  private readonly file = join(app.getPath('userData'), 'tracker-state.json');
  private state: PersistedState;

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
    return { encryptedToken: null, deviceId: randomUUID() };
  }

  private persist(): void {
    mkdirSync(app.getPath('userData'), { recursive: true });
    writeFileSync(this.file, JSON.stringify(this.state), 'utf-8');
  }

  get deviceId(): string {
    return this.state.deviceId;
  }

  getToken(): string | null {
    if (!this.state.encryptedToken || !safeStorage.isEncryptionAvailable()) {
      return null;
    }
    try {
      return safeStorage.decryptString(Buffer.from(this.state.encryptedToken, 'base64'));
    } catch {
      return null;
    }
  }

  setToken(token: string): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('OS secure storage is unavailable; cannot store the sign-in securely.');
    }
    this.state.encryptedToken = safeStorage.encryptString(token).toString('base64');
    this.persist();
  }

  clearToken(): void {
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
