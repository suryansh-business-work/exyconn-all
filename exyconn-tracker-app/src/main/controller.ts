import type {
  AppPreferences,
  AuthUser,
  Branding,
  DayDetail,
  LiveStats,
  LoginResult,
  PermissionKind,
  PermissionState,
  ReportDay,
  TrackerSettings,
  TrackerState,
  TrackerStatus,
  TrackerTotals,
} from '@shared/types';
import { deviceTimezone, effectiveTimezone } from '@shared/timezone';
import { secureStore } from './store';
import { TrackerEngine } from './engine';
import * as portal from './portal-client';
import { TrackerAuthError } from './portal-client';
import { collectDeviceInfo } from './device-info';
import { describeLoginFailure } from './login-message';
import { describeSyncFailure } from './sync-message';
import { getPermissions, requestPermission } from './trackers/permissions';
import type { ComposeInput } from './capture-bridge';

/**
 * How often the app checks in with the portal while signed in. Fast enough that the Devices
 * console's "last seen" means something and an admin's settings change lands within a
 * minute; slow enough to be one small request per employee per minute.
 */
const PORTAL_POLL_MS = 60_000;

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
  /**
   * The zone the whole UI renders in. Signed out, that is simply this computer's zone; signed
   * in, it is whatever the portal resolved for this employee (their pick, else the house
   * default). Held here so the report query and the renderer agree on ONE zone.
   */
  private timezone: string = deviceTimezone();
  /** The keep-alive/settings poll; runs only while somebody is signed in. */
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly onChange: (state: TrackerState) => void,
    /** Fired on every screenshot so the shell can broadcast it (the shutter sound). */
    private readonly onCapture: (count: number) => void,
    /**
     * Adds the webcam photo to a screenshot. Injected rather than imported because it needs a
     * BrowserWindow, which this class deliberately knows nothing about — that is what keeps
     * it unit-testable.
     */
    private readonly composeWithWebcam: (input: ComposeInput) => Promise<string | null>,
  ) {}

  getState(): TrackerState {
    return {
      status: this.status,
      user: this.user,
      settings: this.settings,
      branding: this.branding,
      permissions: this.permissions,
      stats: { ...this.stats, status: this.status },
      preferences: secureStore().preferences,
      rememberMe: secureStore().remembered,
      signedOutReason: this.signedOutReason,
      timezone: this.timezone,
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
      this.applyPortalState(await portal.trackerMe());
      this.buildEngine();
      this.startPolling();
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
      this.startPolling();
      await this.syncFromPortal();
      return { ok: true, consentRequired: result.consentRequired, user: result.user };
    } catch (error) {
      // The raw failure is logged, never shown: the login screen gets a sentence, the
      // developer console keeps the status code and the portal's reason.
      console.error('Tracker sign-in failed', error);
      return { ok: false, error: describeLoginFailure(error) };
    }
  }

  /**
   * The sign-in payload carries no zone (the portal's TrackerLoginPayload has no `timezone`
   * field), so the full state is fetched right after. It runs AFTER the sign-in has been
   * emitted and swallows its own failure: an employee who is signed in must not be bounced
   * back to the login screen because one follow-up query failed. They keep this device's zone
   * until the next heartbeat corrects it.
   */
  private async syncFromPortal(): Promise<void> {
    try {
      this.applyPortalState(await portal.trackerMe());
      this.emit();
    } catch (error) {
      console.error('Could not read the portal after sign-in; using this device’s zone', error);
    }
  }

  /**
   * Adopts the portal's view of this employee: their settings, their consent state and the
   * zone every time in this app is rendered in. The engine reads the settings on every tick,
   * so handing them over here is what makes an admin's change to the interval, the screenshot
   * rules or the sync cadence take effect on a RUNNING app rather than at the next restart.
   *
   * Returns whether anything actually moved, so a quiet heartbeat does not re-render the UI
   * once a minute for nothing.
   */
  private applyPortalState(me: portal.TrackerMeResponse): boolean {
    const before = this.stateSignature();

    this.user = me.user;
    this.settings = me.settings;
    this.timezone = effectiveTimezone(me.timezone);
    this.status = this.statusFor(me.consentRequired);
    this.engine?.updateSettings(me.settings);
    // Turning webcam capture on introduces a permission the employee has never been asked for.
    this.permissions = getPermissions(me.settings.webcamEnabled);

    return this.stateSignature() !== before;
  }

  /** The portal-owned slice of the state, for spotting a change without comparing by hand. */
  private stateSignature(): string {
    return JSON.stringify([this.user, this.settings, this.timezone, this.status, this.permissions]);
  }

  /**
   * Where the portal's consent answer leaves the app. A heartbeat must never interrupt work
   * in progress, so only the resting states follow the portal; `tracking` and `paused` are
   * left exactly as they are.
   */
  private statusFor(consentRequired: boolean): TrackerStatus {
    if (this.status === 'tracking' || this.status === 'paused') {
      return this.status;
    }
    return consentRequired ? 'consent-required' : 'idle';
  }

  /**
   * Keeps this app and the portal in step for as long as somebody is signed in.
   *
   * Without it the app read the portal exactly once, at sign-in: settings an admin changed
   * never arrived, the Devices console's "last seen" stayed frozen at enrolment, and an app
   * sitting idle after its access was revoked only found out at its next upload — which,
   * with nothing to upload, never came.
   */
  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.poll().catch((error: unknown) => console.error('Portal poll failed', error));
    }, PORTAL_POLL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /** One check-in: adopt whatever the portal now says, and sign out if it says we are revoked. */
  private async poll(): Promise<void> {
    try {
      if (this.applyPortalState(await portal.heartbeat(collectDeviceInfo()))) {
        this.emit();
      }
    } catch (error) {
      if (error instanceof TrackerAuthError) {
        await this.logout(describeSyncFailure(error));
        return;
      }
      // A portal that is briefly unreachable must not disturb a tracking session — the work
      // keeps accruing in the durable outbox and the next check-in picks the change up.
      console.error('Portal heartbeat failed', error);
    }
  }

  /**
   * Records the zone this employee picked, and re-renders the whole app in it. The portal is
   * the source of truth: we adopt what it stored, not what we sent.
   */
  async setTimezone(timezone: string): Promise<string> {
    const stored = await portal.setTimezone(timezone);
    this.timezone = effectiveTimezone(stored);
    this.emit();
    return this.timezone;
  }

  /** The employee's own all-time totals (device-token scoped — never anybody else's). */
  getTotals(): Promise<TrackerTotals> {
    return portal.fetchMyTotals();
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
    // Before the re-entry guard: a poll that lands mid-sign-out must not restart the timer's
    // life beyond the session it belongs to.
    this.stopPolling();
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
    // The zone belonged to the employee who just left, not to this computer.
    this.timezone = deviceTimezone();
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
   * The employee's own tracked time (the portal scopes this to them). The portal buckets the
   * days by the zone we send, so it must be the SAME zone the renderer computed the range in
   * and will label the rows with — this device's zone is no longer that zone once an employee
   * has picked one.
   */
  getReport(from: string, to: string): Promise<ReportDay[]> {
    return portal.fetchMyReport(from, to, this.timezone);
  }

  /** One day of the employee's own work — totals plus that day's screenshots. */
  getDay(start: string, end: string): Promise<DayDetail> {
    return portal.fetchMyDay(start, end);
  }

  /**
   * Re-reads the OS grants. Camera only counts as required when the workspace has webcam
   * capture switched on, so the settings have to be in hand — which is why every caller runs
   * after the portal state has been applied.
   */
  refreshPermissions(): PermissionState {
    this.permissions = getPermissions(this.settings?.webcamEnabled ?? false);
    return this.permissions;
  }

  requestPermission(kind: PermissionKind): Promise<void> {
    return requestPermission(kind);
  }

  /** Updates this install's own preferences (tray behaviour) and re-renders. */
  setPreferences(update: Partial<AppPreferences>): AppPreferences {
    const preferences = secureStore().setPreferences(update);
    this.emit();
    return preferences;
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
      onCapture: (count: number) => this.onCapture(count),
      onAuthError: (reason: string) => {
        this.logout(reason).catch((cause: unknown) =>
          console.error('Forced sign-out failed', cause),
        );
      },
      composeWithWebcam: (input) => this.composeWithWebcam(input),
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
