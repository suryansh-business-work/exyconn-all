import type {
  AuthUser,
  Branding,
  DayDetail,
  LiveStats,
  LoginResult,
  PermissionState,
  ReportDay,
  SyncOutcome,
  TrackerSettings,
  TrackerState,
  TrackerStatus,
} from '@shared/types';
import { secureStore } from './store';
import { TrackerEngine } from './engine';
import * as portal from './portal-client';
import { collectDeviceInfo } from './device-info';
import { getPermissions, requestPermission } from './trackers/permissions';

/**
 * Owns tracker app state and mediates every command from the renderer/tray. The window,
 * tray and IPC layer call into this; it never imports Electron UI itself, so its logic is
 * unit-testable. State changes are pushed out through the `onChange` listener.
 */
export class TrackerController {
  private user: AuthUser | null = null;
  private settings: TrackerSettings | null = null;
  private branding: Branding | null = null;
  private engine: TrackerEngine | null = null;
  private status: TrackerStatus = 'signed-out';
  private permissions: PermissionState = getPermissions();
  private stats: LiveStats = idleStats();
  /** Why the app signed the employee out on its own; cleared as soon as they sign back in. */
  private signedOutReason: string | null = null;

  constructor(private readonly onChange: (state: TrackerState) => void) {}

  getState(): TrackerState {
    return {
      status: this.status,
      user: this.user,
      settings: this.settings,
      branding: this.branding,
      permissions: this.permissions,
      stats: { ...this.stats, status: this.status },
      rememberMe: secureStore().remembered,
      signedOutReason: this.signedOutReason,
    };
  }

  /**
   * Restores a remembered session on launch. The stored device token never expires, so we
   * ask the portal who it belongs to and rebuild the full session — without this the app
   * would hold a valid token but show the login screen, and "Remember me" would do nothing.
   */
  async restore(): Promise<void> {
    await this.loadBranding();

    if (!secureStore().getToken()) {
      this.emit();
      return;
    }

    try {
      const me = await portal.trackerMe();
      this.user = me.user;
      this.settings = me.settings;
      this.status = me.consentRequired ? 'consent-required' : 'idle';
      this.buildEngine();
    } catch {
      // Device or access revoked while we were away — drop the stale token.
      secureStore().clearToken();
      this.status = 'signed-out';
    }

    this.refreshPermissions();
    this.emit();
  }

  /** Branding is public, so it loads before sign-in (the login screen shows the logo). */
  private async loadBranding(): Promise<void> {
    try {
      this.branding = await portal.fetchBranding();
    } catch {
      // A branding outage must not block sign-in; the UI falls back to its defaults.
      this.branding = null;
    }
  }

  async login(email: string, password: string, rememberMe: boolean): Promise<LoginResult> {
    try {
      const result = await portal.login(email, password, collectDeviceInfo());
      secureStore().setToken(result.token, rememberMe);
      this.signedOutReason = null;
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

  /**
   * The outbox is only uploadable while the device token exists, so a final flush runs BEFORE
   * the token is dropped — otherwise signing out would strand the employee's queued work.
   */
  async logout(reason: string | null = null): Promise<void> {
    if (this.status === 'signed-out') {
      return; // an auth error during the sign-out flush would otherwise re-enter here
    }
    await this.stop();
    try {
      await this.engine?.syncNow();
    } catch (error) {
      // A failing portal must never trap someone in a signed-in app.
      console.error('Final sync before sign-out failed', error);
    }
    secureStore().clearToken();
    this.user = null;
    this.settings = null;
    this.engine = null;
    this.status = 'signed-out';
    this.stats = idleStats();
    // Set AFTER the stats reset — idleStats() would otherwise wipe the very reason we are here.
    this.signedOutReason = reason;
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

  /**
   * Manual "Sync now" — uploads everything queued, regardless of the auto-sync setting.
   * `engine` is null until settings load, and `engine?.syncNow()` quietly resolved to
   * undefined in that window: the button appeared to work and did nothing. Say so instead.
   */
  async syncNow(): Promise<SyncOutcome> {
    if (!this.engine) {
      return {
        kind: 'unavailable',
        reason: 'The tracker is still starting up. Wait a moment, then try again.',
      };
    }
    return this.engine.syncNow();
  }

  /** The employee's own tracked time (the portal scopes this to them). */
  async getReport(from: string, to: string): Promise<ReportDay[]> {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return portal.fetchMyReport(from, to, timezone);
  }

  /** One day of the employee's own work — totals plus that day's screenshots. */
  getDay(start: string, end: string): Promise<DayDetail> {
    return portal.fetchMyDay(start, end);
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
      onAuthError: (reason: string) => {
        this.logout(reason).catch((cause: unknown) =>
          console.error('Forced sign-out failed', cause),
        );
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
    lastSyncOutcome: null,
  };
}
