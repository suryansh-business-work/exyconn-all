import { Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import trayIconPath from '../../resources/tray.png?asset';
import type { TrackerState, TrackerStatus } from '@shared/types';

const STATUS_LABEL: Record<TrackerStatus, string> = {
  'signed-out': 'Signed out',
  'consent-required': 'Consent required',
  idle: 'Not tracking',
  tracking: 'Tracking…',
  paused: 'Paused',
};

/** Tray icon + menu. A visible indicator is deliberate — the app is never hidden. */
export class TrackerTray {
  private readonly tray: Tray;

  constructor(
    private readonly window: BrowserWindow,
    private readonly actions: {
      start: () => void;
      pause: () => void;
      resume: () => void;
      stop: () => void;
      quit: () => void;
    },
  ) {
    // The tray icon is load-bearing, not decoration: the consent screen promises the employee
    // that tracking is always visibly indicated, and an empty icon quietly breaks that promise.
    // `?asset` makes electron-vite emit the file into out/, so it resolves in dev AND packaged.
    this.tray = new Tray(nativeImage.createFromPath(trayIconPath));
    this.tray.setToolTip('Exyconn Tracker');
    this.tray.on('click', () => this.showWindow());
  }

  update(state: TrackerState): void {
    this.tray.setToolTip(`Exyconn Tracker — ${STATUS_LABEL[state.status]}`);
    this.tray.setContextMenu(
      this.buildMenu(state.status, state.workday?.attendanceMarked ?? false),
    );
  }

  /**
   * `attendanceMarked` is the same gate the dashboard's Start button honours. The tray must
   * not be the way around it: a menu entry that opens a session the portal then refuses tells
   * the employee they are being tracked when they are not, and the tray has nowhere to show
   * the error.
   */
  private buildMenu(status: TrackerStatus, attendanceMarked: boolean): Menu {
    const tracking = status === 'tracking';
    const paused = status === 'paused';
    const canStart = status === 'idle' && attendanceMarked;
    const startLabel = attendanceMarked
      ? 'Start tracking'
      : 'Start tracking (mark attendance first)';

    return Menu.buildFromTemplate([
      { label: `Exyconn Tracker — ${STATUS_LABEL[status]}`, enabled: false },
      { type: 'separator' },
      { label: 'Open', click: () => this.showWindow() },
      { label: startLabel, enabled: canStart, click: this.actions.start },
      { label: 'Pause', enabled: tracking, click: this.actions.pause },
      { label: 'Resume', enabled: paused, click: this.actions.resume },
      { label: 'Stop', enabled: tracking || paused, click: this.actions.stop },
      { type: 'separator' },
      { label: 'Quit', click: this.actions.quit },
    ]);
  }

  private showWindow(): void {
    this.window.show();
    this.window.focus();
  }

  destroy(): void {
    this.tray.destroy();
  }
}
