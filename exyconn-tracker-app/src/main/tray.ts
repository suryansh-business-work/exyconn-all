import { Tray, Menu, nativeImage, BrowserWindow } from 'electron';
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
    // A 1px transparent base; the real icon ships as a build resource in production.
    this.tray = new Tray(nativeImage.createEmpty());
    this.tray.setToolTip('Exyconn Tracker');
    this.tray.on('click', () => this.showWindow());
  }

  update(state: TrackerState): void {
    this.tray.setToolTip(`Exyconn Tracker — ${STATUS_LABEL[state.status]}`);
    this.tray.setContextMenu(this.buildMenu(state.status));
  }

  private buildMenu(status: TrackerStatus): Menu {
    const tracking = status === 'tracking';
    const paused = status === 'paused';
    const canStart = status === 'idle';

    return Menu.buildFromTemplate([
      { label: `Exyconn Tracker — ${STATUS_LABEL[status]}`, enabled: false },
      { type: 'separator' },
      { label: 'Open', click: () => this.showWindow() },
      { label: 'Start tracking', enabled: canStart, click: this.actions.start },
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
