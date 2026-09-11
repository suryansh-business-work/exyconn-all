import { autoUpdater } from 'electron-updater';
import type { UpdateState } from '@shared/types';

/** How often an installed app looks for a newer build. */
const CHECK_INTERVAL_MS = 6 * 60 * 60_000;

/** A pause after launch, so the first check never competes with restoring the session. */
const FIRST_CHECK_MS = 15_000;

/** The instant a check completed, in the one format every timestamp in this app travels in. */
function nowISO(): string {
  return new Date().toISOString();
}

/** Nothing found, nothing pending — what an up-to-date install reports. */
export const IDLE_UPDATE: UpdateState = {
  stage: 'idle',
  version: '',
  percent: 0,
  lastCheckedAt: null,
};

/**
 * The portal serves the update feed rather than GitHub serving it directly: the app already
 * knows the portal's address, and the portal already holds the credentials that read the
 * release. See the server's /tracker-updates route.
 */
export function feedUrlFor(graphqlUrl: string): string {
  return `${new URL(graphqlUrl).origin}/tracker-updates`;
}

/**
 * Keeps the installed tracker up to date.
 *
 * Installers were handed out by hand — a Slack message per release, and an employee who
 * missed it stayed on an old build forever. This downloads a new version in the background
 * and installs it between sessions (or on the next quit), so the fleet converges without
 * anybody being asked to.
 *
 * A failure here is never allowed to matter: an unreachable feed leaves the app tracking
 * exactly as it was, and the next check tries again.
 */
export class AppUpdater {
  private state: UpdateState = IDLE_UPDATE;
  private timer: NodeJS.Timeout | null = null;
  /**
   * Whether a feed has actually been wired. Only a packaged app has an installer to replace,
   * so in development "check for updates" has nothing to check and says so quietly rather
   * than reporting a failure the developer cannot act on.
   */
  private started = false;
  /** The employee's "Update automatically": fetch without asking, and install between sessions. */
  private automatic = false;
  /** Set once an install has begun, so repeated triggers cannot launch the installer twice. */
  private installing = false;

  constructor(private readonly onChange: (state: UpdateState) => void) {}

  get current(): UpdateState {
    return this.state;
  }

  /**
   * Whether a downloaded version should be installed without asking. The caller still decides
   * WHEN — only the main process knows whether a session is running.
   */
  get installsAutomatically(): boolean {
    return this.automatic && this.state.stage === 'ready';
  }

  /** Wires the feed and starts checking. Call once, and only from a packaged app. */
  start(graphqlUrl: string, automatic: boolean): void {
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrlFor(graphqlUrl) });
    this.started = true;
    // The fetch runs in the background without interrupting anything, and nothing is ever
    // installed mid-session.
    this.automatic = automatic;
    autoUpdater.autoDownload = automatic;
    // The employee is offered a restart, but never made to take it: whenever they quit the
    // app themselves, the version already on disk is the one that comes back.
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () =>
      this.set({ stage: 'checking', version: '', percent: 0 }),
    );
    autoUpdater.on('update-not-available', () =>
      // NOT `IDLE_UPDATE` wholesale: that would blank the timestamp this very check just
      // earned, and "when did it last look" is the only thing an up-to-date app can report.
      this.set({ stage: 'idle', version: '', percent: 0, lastCheckedAt: nowISO() }),
    );
    autoUpdater.on('update-available', (info: { version: string }) =>
      this.set({
        stage: 'available',
        version: info.version,
        percent: 0,
        lastCheckedAt: nowISO(),
      }),
    );
    autoUpdater.on('download-progress', (progress: { percent: number }) =>
      this.set({ stage: 'downloading', percent: Math.round(progress.percent) }),
    );
    autoUpdater.on('update-downloaded', (info: { version: string }) => {
      // Nothing left to look for until this one is installed, so the timer stops here —
      // which is also what keeps a re-check from withdrawing an offer already made.
      this.stop();
      this.set({ stage: 'ready', version: info.version, percent: 100 });
    });
    autoUpdater.on('error', (error: Error) => {
      console.error('Update check failed', error);
      // Whatever was under way has stopped, an install included — so it may be tried again.
      this.installing = false;
      // The version is kept, so a failed download still offers the retry it belongs to rather
      // than forgetting which version it was trying to fetch.
      this.set({ stage: 'failed', percent: 0, lastCheckedAt: nowISO() });
    });

    this.timer = setTimeout(() => {
      this.check();
      this.timer = setInterval(() => this.check(), CHECK_INTERVAL_MS);
    }, FIRST_CHECK_MS);
  }

  /**
   * Starts fetching the available version.
   *
   * Returns as soon as the download has been asked for, never when it finishes: the employee
   * pressed a button in a tracker that is probably mid-session, and the answer to that press
   * is a progress bar, not a frozen window. Progress arrives on the state channel.
   */
  download(): void {
    if (this.state.stage !== 'available' && this.state.stage !== 'failed') {
      return;
    }
    if (!this.started) {
      return;
    }
    this.set({ stage: 'downloading', percent: 0 });
    autoUpdater.downloadUpdate().catch((error: unknown) => {
      console.error('Downloading the update failed', error);
      this.set({ stage: 'failed', percent: 0 });
    });
  }

  /**
   * Quits, installs the downloaded version and starts it again. Only meaningful once the
   * stage is 'ready'. Silent, so a Windows update is a restart rather than an installer
   * wizard — the same whether the employee pressed Restart or it happened on its own.
   */
  install(): void {
    if (this.installing) {
      return;
    }
    this.installing = true;
    autoUpdater.quitAndInstall(true, true);
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Updates without asking, or waits to be asked.
   *
   * Applied live rather than only at launch: an employee who turns it on in Settings while
   * an update is already waiting expects that update to start arriving, not to arrive after
   * the next restart — so a version already found is picked up here too.
   */
  setAutomatic(enabled: boolean): void {
    this.automatic = enabled;
    autoUpdater.autoDownload = enabled;
    if (enabled && this.state.stage === 'available') {
      this.download();
    }
  }

  /**
   * Looks now, instead of waiting up to six hours for the next scheduled check.
   *
   * The one thing Settings could not do before: an employee who had heard a new version
   * existed had no way to go and get it, and "the app updates itself" is not an answer to
   * "is mine current?". A development build has no installer to replace, so it answers
   * with the timestamp and nothing else rather than reporting a failure nobody can act on.
   */
  async checkNow(): Promise<void> {
    if (!this.started) {
      this.set({ stage: 'idle', lastCheckedAt: nowISO() });
      return;
    }
    if (this.state.stage === 'downloading' || this.state.stage === 'ready') {
      return; // there is already a version in hand; re-checking could only withdraw it
    }
    await autoUpdater.checkForUpdates().catch((error: unknown) => {
      console.error('Update check failed', error);
      this.set({ stage: 'failed', percent: 0, lastCheckedAt: nowISO() });
    });
  }

  private check(): void {
    this.checkNow().catch((error: unknown) => {
      console.error('Scheduled update check failed', error);
    });
  }

  private set(update: Partial<UpdateState>): void {
    this.state = { ...this.state, ...update };
    this.onChange(this.state);
  }
}
