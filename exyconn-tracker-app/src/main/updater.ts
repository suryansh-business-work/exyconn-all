import { autoUpdater } from 'electron-updater';
import type { UpdateState } from '@shared/types';

/** How often an installed app looks for a newer build. */
const CHECK_INTERVAL_MS = 6 * 60 * 60_000;

/** A pause after launch, so the first check never competes with restoring the session. */
const FIRST_CHECK_MS = 15_000;

/** Nothing found, nothing pending — what an up-to-date install reports. */
export const IDLE_UPDATE: UpdateState = { stage: 'idle', version: '', percent: 0 };

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
 * and installs it on the next quit, so the fleet converges without anybody being asked to.
 *
 * A failure here is never allowed to matter: an unreachable feed leaves the app tracking
 * exactly as it was, and the next check tries again.
 */
export class AppUpdater {
  private state: UpdateState = IDLE_UPDATE;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly onChange: (state: UpdateState) => void) {}

  get current(): UpdateState {
    return this.state;
  }

  /** Wires the feed and starts checking. Call once, and only from a packaged app. */
  start(graphqlUrl: string): void {
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrlFor(graphqlUrl) });
    // NOT auto-download. A tracker that quietly pulls a few hundred megabytes decides for the
    // employee that now is a good moment to use their connection — on a tethered phone or a
    // hotel wifi it is not. The app offers, they choose, and the fetch then runs in the
    // background without interrupting anything.
    autoUpdater.autoDownload = false;
    // The employee is offered a restart, but never made to take it: whenever they quit the
    // app themselves, the version already on disk is the one that comes back.
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () =>
      this.set({ stage: 'checking', version: '', percent: 0 }),
    );
    autoUpdater.on('update-not-available', () => this.set(IDLE_UPDATE));
    autoUpdater.on('update-available', (info: { version: string }) =>
      this.set({ stage: 'available', version: info.version, percent: 0 }),
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
      // The version is kept, so a failed download still offers the retry it belongs to rather
      // than forgetting which version it was trying to fetch.
      this.set({ stage: 'failed', percent: 0 });
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
    this.set({ stage: 'downloading', percent: 0 });
    autoUpdater.downloadUpdate().catch((error: unknown) => {
      console.error('Downloading the update failed', error);
      this.set({ stage: 'failed', percent: 0 });
    });
  }

  /** Quits and installs the downloaded version. Only meaningful once the stage is 'ready'. */
  install(): void {
    autoUpdater.quitAndInstall();
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private check(): void {
    autoUpdater.checkForUpdates().catch((error: unknown) => {
      console.error('Update check failed', error);
    });
  }

  private set(update: Partial<UpdateState>): void {
    this.state = { ...this.state, ...update };
    this.onChange(this.state);
  }
}
