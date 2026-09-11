import { randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { TrackerStore } from '@exyconn/tracker-core';
import { documentFile } from './json-file';
import type { MobilePreferences } from './types';

const TOKEN_KEY = 'exyconn.tracker.device-token';

interface PersistedState {
  /** Stable per-install device id, generated once. */
  deviceId: string;
  preferences?: Partial<MobilePreferences>;
  /** The project the employee last booked time against — people work on one for weeks. */
  selectedProjectId?: string;
  selectedTaskId?: string;
}

/**
 * Audible by default, following the OS for light/dark, and the progress bar every earlier build
 * drew — the desktop tracker's defaults, minus the tray and self-update it has and a phone does
 * not.
 */
const DEFAULT_PREFERENCES: MobilePreferences = {
  themeMode: 'system',
  muteCaptureSound: false,
  progressStyle: 'bar',
  transparentBackground: false,
  backgroundOpacity: 0.6,
};

/**
 * The phone's sign-in and its own choices.
 *
 * The non-expiring device token lives in the OS keystore (Keychain / Android Keystore) via
 * expo-secure-store, and only when "Remember me" was ticked; otherwise it is held in memory and
 * gone when the app is closed. Everything else is plain state in the documents directory.
 */
class MobileStore implements TrackerStore<MobilePreferences> {
  private readonly file = documentFile('tracker-state.json');
  private state: PersistedState;
  private token: string | null;
  private rememberedToken: boolean;

  constructor() {
    this.state = this.load();
    this.token = SecureStore.getItem(TOKEN_KEY);
    this.rememberedToken = this.token !== null;
  }

  private load(): PersistedState {
    const saved = this.file.read();
    if (saved !== null) {
      try {
        return JSON.parse(saved) as PersistedState;
      } catch (error) {
        // A corrupt state file starts fresh rather than stopping the app from opening.
        console.error('Tracker state was unreadable; starting fresh', error);
      }
    }
    const fresh: PersistedState = { deviceId: randomUUID(), preferences: DEFAULT_PREFERENCES };
    this.write(fresh);
    return fresh;
  }

  /**
   * Never throws. The change already stands in memory; a failed write only loses it at the next
   * launch — whereas a throw here runs inside a tap handler (a theme or project pick), where
   * React Native treats it as fatal and closes the app.
   */
  private write(state: PersistedState): void {
    try {
      this.file.write(JSON.stringify(state));
    } catch (error) {
      console.error('Could not save the tracker state', error);
    }
  }

  private persist(): void {
    this.write(this.state);
  }

  get deviceId(): string {
    return this.state.deviceId;
  }

  get remembered(): boolean {
    return this.rememberedToken;
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string, remember: boolean): void {
    this.token = token;
    this.rememberedToken = remember;
    if (remember) {
      SecureStore.setItem(TOKEN_KEY, token);
      return;
    }
    this.forgetStoredToken();
  }

  clearToken(): void {
    this.token = null;
    this.rememberedToken = false;
    this.forgetStoredToken();
  }

  /** The keystore delete is async; memory is already cleared, so nothing reads the old token. */
  private forgetStoredToken(): void {
    SecureStore.deleteItemAsync(TOKEN_KEY).catch((error: unknown) => {
      console.error('Could not remove the stored sign-in', error);
    });
  }

  get preferences(): MobilePreferences {
    return { ...DEFAULT_PREFERENCES, ...this.state.preferences };
  }

  setPreferences(update: Partial<MobilePreferences>): MobilePreferences {
    this.state.preferences = { ...this.preferences, ...update };
    this.persist();
    return this.preferences;
  }

  get selectedProjectId(): string {
    return this.state.selectedProjectId ?? '';
  }

  setSelectedProject(projectId: string): void {
    this.state.selectedProjectId = projectId;
    // A ticket belongs to its project; it cannot follow the employee to another one.
    this.state.selectedTaskId = '';
    this.persist();
  }

  get selectedTaskId(): string {
    return this.state.selectedTaskId ?? '';
  }

  setSelectedTask(taskId: string): void {
    this.state.selectedTaskId = taskId;
    this.persist();
  }
}

let instance: MobileStore | null = null;

/** The one store, created on first use (after the native modules are ready). */
export function mobileStore(): MobileStore {
  instance ??= new MobileStore();
  return instance;
}
