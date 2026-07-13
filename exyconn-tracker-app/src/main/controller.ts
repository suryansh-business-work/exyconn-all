import { app, hostname } from './platform';
import type {
  AuthUser,
  LiveStats,
  LoginResult,
  PermissionState,
  TrackerSettings,
  TrackerState,
  TrackerStatus,
} from '@shared/types';
import { secureStore } from './store';
import { TrackerEngine } from './engine';
import * as portal from './portal-client';
import { getPermissions, requestPermission } from './trackers/permissions';

/**
 * Owns tracker app state and mediates every command from the renderer/tray. The window,
 * tray and IPC layer call into this; it never imports Electron UI itself, so its logic is
 * unit-testable. State changes are pushed out through the `onChange` listener.
 */
export class TrackerController {
  private user: AuthUser | null = null;
  private settings: TrackerSettings | null = null;
  private engine: TrackerEngine | null = null;
  private status: TrackerStatus = 'signed-out';
  private permissions: PermissionState = getPermissions();
  private stats: LiveStats = idleStats();

  constructor(private readonly onChange: (state: TrackerState) => void) {}

  getState(): TrackerState {
    return {
      status: this.status,
      user: this.user,
      settings: this.settings,
      permissions: this.permissions,
      stats: { ...this.stats, status: this.status },
    };
  }

  /** Attempts to restore a previous non-expiring session on launch. */
  async restore(): Promise<void> {
    if (!secureStore().getToken()) {
      return;
    }
    // A stored token means a device was registered; confirm it still works with a heartbeat.
    try {
      await portal.heartbeat();
    } catch {
      secureStore().clearToken();
    }
    this.refreshPermissions();
    this.emit();
  }

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const result = await portal.login(email, password, {
        deviceId: secureStore().deviceId,
        platform: process.platform,
        hostname: hostname(),
        appVersion: app.getVersion(),
      });
      secureStore().setToken(result.token);
      this.user = result.user;
      this.settings = result.settings;
      this.status = result.consentRequired ? 'consent-required' : 'idle';
      this.buildEngine();
      this.refreshPermissions();
      this.emit();
      return { ok: true, consentRequired: result.consentRequired, user: result.user };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Sign-in failed' };
    }
  }

  async acceptConsent(): Promise<void> {
    await portal.acceptConsent();
    if (this.status === 'consent-required') {
      this.status = 'idle';
      this.emit();
    }
  }

  async logout(): Promise<void> {
    await this.stop();
    secureStore().clearToken();
    this.user = null;
    this.settings = null;
    this.engine = null;
    this.status = 'signed-out';
    this.stats = idleStats();
    this.emit();
  }

  async start(): Promise<void> {
    if (!this.engine || this.status === 'consent-required') {
      return;
    }
    await this.engine.start();
    this.status = 'tracking';
    this.emit();
  }

  pause(): void {
    this.engine?.pause();
    this.status = 'paused';
    this.emit();
  }

  resume(): void {
    this.engine?.resume();
    this.status = 'tracking';
    this.emit();
  }

  async stop(): Promise<void> {
    await this.engine?.stop();
    if (this.user) {
      this.status = 'idle';
    }
    this.emit();
  }

  /** Manual "Sync now" — uploads everything queued, regardless of the auto-sync setting. */
  async syncNow(): Promise<void> {
    await this.engine?.syncNow();
  }

  refreshPermissions(): PermissionState {
    this.permissions = getPermissions();
    return this.permissions;
  }

  requestPermission(kind: 'screenRecording' | 'accessibility'): Promise<void> {
    return requestPermission(kind);
  }

  private buildEngine(): void {
    if (!this.settings) {
      return;
    }
    this.engine = new TrackerEngine(this.settings, {
      onStats: (stats) => {
        this.stats = stats;
        this.emit();
      },
      onAuthError: () => {
        void this.logout();
      },
    });
  }

  private emit(): void {
    this.onChange(this.getState());
  }
}

function idleStats(): LiveStats {
  return {
    status: 'signed-out',
    sessionActiveMs: 0,
    sessionIdleMs: 0,
    keyCount: 0,
    mouseCount: 0,
    currentApp: '',
    screenshotCount: 0,
    pendingSync: 0,
    lastSyncAt: null,
    syncing: false,
    lastSyncError: null,
  };
}
