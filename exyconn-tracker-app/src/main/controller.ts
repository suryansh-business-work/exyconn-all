import type {
  AppPreferences,
  AttendanceStatus,
  AuthUser,
  Branding,
  ConsentPolicy,
  DayDetail,
  LiveStats,
  LoginResult,
  PermissionKind,
  PermissionState,
  ReportDay,
  TrackerProject,
  TrackerSettings,
  TrackerTask,
  TrackerState,
  TrackerStatus,
  TrackerTotals,
  WorkProfile,
  Workday,
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
import { decideAutoAction, hourIn, isWithinWindow } from './auto-start';
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
  private workProfile: WorkProfile | null = null;
  private workday: Workday | null = null;
  private projects: TrackerProject[] = [];
  /** Tickets on the SELECTED project. Reloaded when that changes, not on every heartbeat. */
  private tasks: TrackerTask[] = [];
  private consentPolicy: ConsentPolicy | null = null;
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
  /**
   * The employee stopped or paused tracking themselves inside the scheduled window.
   *
   * Without it the schedule would restart within the minute and there would be no way to
   * finish early. Cleared as soon as the window ends, so tomorrow starts on schedule again.
   */
  private autoOverride = false;

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
      stats: { ...this.stats, status: this.status, dayActiveMs: this.dayActiveMs() },
      workProfile: this.workProfile,
      workday: this.workday,
      projects: this.projects,
      selectedProjectId: this.selectedProjectId(),
      tasks: this.tasks,
      selectedTaskId: this.selectedTaskId(),
      consentPolicy: this.consentPolicy,
      preferences: secureStore().preferences,
      rememberMe: secureStore().remembered,
      signedOutReason: this.signedOutReason,
      timezone: this.timezone,
    };
  }

  /**
   * Active ms worked today, live.
   *
   * The engine owns it once one exists, because only it knows the session in progress. Before
   * that — a just-restored app, or one sitting idle — the portal's number for the day is the
   * whole answer, and reading it here is what stops the progress bar showing zero until the
   * first tick lands.
   */
  private dayActiveMs(): number {
    return this.engine?.dayActiveMs ?? this.workday?.activeMs ?? 0;
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
      this.loadTasks().catch((error: unknown) => console.error('Loading tickets failed', error));
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
      this.loadTasks().catch((error: unknown) => console.error('Loading tickets failed', error));
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
    this.workProfile = me.workProfile;
    this.projects = me.projects;
    this.consentPolicy = me.consentPolicy;
    this.adoptWorkday(me.workday);
    this.timezone = effectiveTimezone(me.timezone);
    this.status = this.statusFor(me.consentRequired);
    this.engine?.updateSettings(me.settings);
    // Turning webcam capture on introduces a permission the employee has never been asked for.
    this.permissions = getPermissions(me.settings.webcamEnabled);

    return this.stateSignature() !== before;
  }

  /** The portal-owned slice of the state, for spotting a change without comparing by hand. */
  private stateSignature(): string {
    return JSON.stringify([
      this.user,
      this.settings,
      this.timezone,
      this.status,
      this.permissions,
      this.workProfile,
      this.workday,
      this.projects,
      this.consentPolicy,
    ]);
  }

  /**
   * Takes the portal's view of today, and decides whether it may reset the day's baseline.
   *
   * Mid-session it may not: the portal's number already includes the intervals this very
   * session has uploaded, and adding the live session on top of that would count those
   * minutes twice. A new calendar date is the exception — the day has genuinely restarted,
   * and yesterday's session is not today's progress.
   */
  private adoptWorkday(next: Workday): void {
    const rolledOver = this.workday !== null && this.workday.date !== next.date;
    const running = this.status === 'tracking' || this.status === 'paused';
    this.workday = next;
    if (!running || rolledOver) {
      this.engine?.setDayBase(next.activeMs);
    }
  }

  /**
   * The project the next session books against: the employee's own pick if it is still one
   * they may book to, else the first project the portal offered — which is the house-wide
   * Global Project. Never empty once the portal has answered.
   */
  private selectedProjectId(): string {
    const stored = secureStore().selectedProjectId;
    const known = this.projects.some((project) => project.id === stored);
    return known ? stored : (this.projects[0]?.id ?? '');
  }

  /**
   * The ticket the next session books against, or '' for "the project, no ticket".
   *
   * A stored id that is not on the current board resolves to '' rather than being sent
   * anyway: the portal would refuse it, and losing the ticket is better than losing the
   * session it was attached to.
   */
  private selectedTaskId(): string {
    const stored = secureStore().selectedTaskId;
    return this.tasks.some((task) => task.id === stored) ? stored : '';
  }

  /** Records which project the employee wants their next session booked against. */
  setProject(projectId: string): string {
    secureStore().setSelectedProject(projectId);
    this.emit();
    // The board changed, so the ticket list has to as well. Fire-and-forget: the picker
    // shows "no ticket" until it lands, which is exactly what is booked in the meantime.
    this.loadTasks().catch((error: unknown) => console.error('Loading tickets failed', error));
    return this.selectedProjectId();
  }

  /** Records which ticket the employee wants their next session booked against. */
  setTask(taskId: string): string {
    secureStore().setSelectedTask(taskId);
    this.emit();
    return this.selectedTaskId();
  }

  /** Loads the selected project's tickets. Never throws into a caller — the picker degrades. */
  private async loadTasks(): Promise<void> {
    const projectId = this.selectedProjectId();
    if (!this.user || projectId === '') {
      this.tasks = [];
      return;
    }
    this.tasks = await portal.fetchTasks(projectId);
    this.emit();
  }

  /**
   * Marks the employee in for their local day, which is what unlocks tracking.
   *
   * The portal decides which day that is (from the zone it resolved for them) and upserts the
   * same record HR's own page writes — so somebody who marked in from the portal this morning
   * is already marked in here.
   */
  async markAttendance(status: AttendanceStatus, note: string | null): Promise<Workday> {
    const workday = await portal.markAttendance(status, note);
    this.adoptWorkday(workday);
    this.emit();
    return workday;
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
      await this.runSchedule();
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

  /**
   * Records the employee's acceptance. `signedName` is their typed signature, which the
   * portal also files in Legal's ledger when the workspace has chosen a policy.
   *
   * The portal is re-read afterwards rather than assumed: it owns whether consent is still
   * required, and a signature that failed to land must not leave the app believing it did.
   */
  async acceptConsent(signedName: string): Promise<void> {
    await portal.acceptConsent(signedName);
    await this.syncFromPortal();
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
    await this.stopTracking();
    try {
      await this.engine?.syncNow();
    } catch (error) {
      // A failing portal must never trap someone in a signed-in app.
      console.error('Final sync before sign-out failed', error);
    }
    secureStore().clearToken();
    this.user = null;
    this.settings = null;
    this.workProfile = null;
    this.workday = null;
    this.projects = [];
    this.tasks = [];
    this.consentPolicy = null;
    this.engine = null;
    this.status = 'signed-out';
    this.stats = idleStats();
    // The zone belonged to the employee who just left, not to this computer.
    this.timezone = deviceTimezone();
    // Set AFTER the stats reset — idleStats() would otherwise wipe the very reason we are here.
    this.signedOutReason = reason;
    this.emit();
  }

  /**
   * Starts tracking, against the chosen project.
   *
   * Attendance is checked here as well as on the portal so the refusal is instant and says
   * what to do about it — but the portal is the one that actually enforces it.
   */
  async start(): Promise<void> {
    if (!this.engine || this.status === 'consent-required') {
      return;
    }
    if (!this.workday?.attendanceMarked) {
      throw new Error('Mark your attendance for today before tracking can start.');
    }
    // Starting by hand inside the window clears an earlier early-finish: the employee has
    // said they are working again, and the schedule should stop holding yesterday's answer.
    this.autoOverride = false;
    this.engine.setDayBase(this.workday.activeMs);
    await this.engine.start(this.selectedProjectId(), this.selectedTaskId());
    this.status = 'tracking';
    this.emit();
  }

  pause(): void {
    this.autoOverride = true;
    this.engine?.pause();
    this.status = 'paused';
    this.emit();
  }

  resume(): void {
    this.autoOverride = false;
    this.engine?.resume();
    this.status = 'tracking';
    this.emit();
  }

  /** Stopped by the employee: the schedule must not restart it before the window ends. */
  async stop(): Promise<void> {
    this.autoOverride = true;
    await this.stopTracking();
  }

  /** Stops without recording an override — used by sign-out and by the schedule itself. */
  private async stopTracking(): Promise<void> {
    await this.engine?.stop();
    if (this.user) {
      this.status = 'idle';
    }
    this.emit();
  }

  /**
   * Applies the workspace's tracking schedule. Called on sign-in and on every portal poll,
   * so a change to the window lands within the minute without a restart.
   */
  private async runSchedule(): Promise<void> {
    const settings = this.settings;
    if (!settings?.autoStartEnabled || !this.user) {
      return;
    }
    const hour = hourIn(this.timezone);
    // Leaving the window is what forgives an early finish; without this the override would
    // outlive the day it was made on and the schedule would never start again.
    if (!isWithinWindow(settings.autoStartHour, settings.autoStopHour, hour)) {
      this.autoOverride = false;
    }

    const action = decideAutoAction({
      enabled: settings.autoStartEnabled,
      startHour: settings.autoStartHour,
      stopHour: settings.autoStopHour,
      hour,
      status: this.status,
      attendanceMarked: this.workday?.attendanceMarked ?? false,
      overridden: this.autoOverride,
    });

    try {
      if (action === 'start') {
        await this.start();
      } else if (action === 'stop') {
        await this.stopTracking();
      }
    } catch (error) {
      // A schedule that cannot start (no permission yet, portal briefly down) must not throw
      // into the poll timer — it simply tries again on the next check-in.
      console.error('Scheduled tracking action failed', error);
    }
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
    // The portal's view of the day is usually already in hand by the time an engine exists
    // (applyPortalState runs first, on a controller that has none), so the new engine has to
    // be told where the day stands — otherwise the progress bar restarts from zero on every
    // launch and only recovers at the next heartbeat.
    if (this.workday !== null) {
      this.engine.setDayBase(this.workday.activeMs);
    }
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
    dayActiveMs: 0,
    lastSyncOutcome: null,
  };
}
