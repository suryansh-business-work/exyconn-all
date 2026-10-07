import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserWindow, MenuItemConstructorOptions } from 'electron';
import type { TrackerState, TrackerStatus } from '@shared/types';

const { trays, createFromPath } = vi.hoisted(() => ({
  trays: [] as FakeTray[],
  createFromPath: vi.fn((path: string) => ({ path })),
}));

interface FakeTray {
  image: unknown;
  tooltip: string;
  menu: MenuItemConstructorOptions[];
  click?: () => void;
  destroyed: boolean;
}

vi.mock('electron', () => ({
  Tray: class {
    image: unknown;
    tooltip = '';
    menu: MenuItemConstructorOptions[] = [];
    click?: () => void;
    destroyed = false;
    constructor(image: unknown) {
      this.image = image;
      trays.push(this);
    }
    setToolTip(text: string): void {
      this.tooltip = text;
    }
    setContextMenu(menu: MenuItemConstructorOptions[]): void {
      this.menu = menu;
    }
    on(_event: string, fn: () => void): void {
      this.click = fn;
    }
    destroy(): void {
      this.destroyed = true;
    }
  },
  // The template itself stands in for the built menu, so the test can read every entry.
  Menu: { buildFromTemplate: (template: MenuItemConstructorOptions[]) => template },
  nativeImage: { createFromPath },
  BrowserWindow: class {},
}));

import { TrackerTray } from '../../../src/main/tray';

const actions = {
  start: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  stop: vi.fn(),
  quit: vi.fn(),
};

function stateOf(status: TrackerStatus, attendanceMarked: boolean | null): TrackerState {
  const workday = attendanceMarked === null ? null : { attendanceMarked };
  return { status, workday } as unknown as TrackerState;
}

function item(tray: FakeTray, label: string): MenuItemConstructorOptions {
  const found = tray.menu.find((entry) => entry.label?.startsWith(label));
  expect(found, label).toBeDefined();
  return found ?? {};
}

const enabled = (tray: FakeTray, label: string) => item(tray, label).enabled;

let win: { show: ReturnType<typeof vi.fn>; focus: ReturnType<typeof vi.fn> } | null;

function build() {
  const tracker = new TrackerTray(() => win as unknown as BrowserWindow | null, actions);
  return { tracker, tray: trays.at(-1) as FakeTray };
}

beforeEach(() => {
  trays.length = 0;
  win = { show: vi.fn(), focus: vi.fn() };
});

describe('TrackerTray', () => {
  it('always shows its icon, from the bundled tray image', () => {
    const { tray } = build();

    expect(createFromPath).toHaveBeenCalledWith(expect.stringContaining('tray.png'));
    expect(tray.image).toEqual({ path: createFromPath.mock.calls[0][0] });
    expect(tray.tooltip).toBe('Exyconn Tracker');
  });

  it('opens the current window from a click on the icon or on Open', () => {
    const { tracker, tray } = build();
    tray.click?.();
    expect(win?.show).toHaveBeenCalledTimes(1);
    expect(win?.focus).toHaveBeenCalledTimes(1);

    tracker.update(stateOf('idle', true));
    item(tray, 'Open').click?.({} as never, undefined, {} as never);
    expect(win?.show).toHaveBeenCalledTimes(2);

    win = null;
    expect(() => tray.click?.()).not.toThrow();
  });

  it('offers Start only when idle with attendance marked', () => {
    const { tracker, tray } = build();

    tracker.update(stateOf('idle', true));
    expect(tray.tooltip).toBe('Exyconn Tracker — Not tracking');
    expect(item(tray, 'Exyconn Tracker').label).toBe('Exyconn Tracker — Not tracking');
    expect(item(tray, 'Start tracking')).toMatchObject({
      label: 'Start tracking',
      enabled: true,
      click: actions.start,
    });
    expect(enabled(tray, 'Pause')).toBe(false);
    expect(enabled(tray, 'Resume')).toBe(false);
    expect(enabled(tray, 'Stop')).toBe(false);
    expect(item(tray, 'Quit').click).toBe(actions.quit);
  });

  it('says attendance comes first when it has not been marked', () => {
    const { tracker, tray } = build();

    tracker.update(stateOf('idle', false));
    expect(item(tray, 'Start tracking')).toMatchObject({
      label: 'Start tracking (mark attendance first)',
      enabled: false,
    });

    tracker.update(stateOf('idle', null));
    expect(enabled(tray, 'Start tracking')).toBe(false);
  });

  it('offers Pause and Stop while tracking, Resume and Stop while paused', () => {
    const { tracker, tray } = build();

    tracker.update(stateOf('tracking', true));
    expect(tray.tooltip).toBe('Exyconn Tracker — Tracking…');
    expect(item(tray, 'Pause')).toMatchObject({ enabled: true, click: actions.pause });
    expect(enabled(tray, 'Resume')).toBe(false);
    expect(item(tray, 'Stop')).toMatchObject({ enabled: true, click: actions.stop });
    expect(enabled(tray, 'Start tracking')).toBe(false);

    tracker.update(stateOf('paused', true));
    expect(tray.tooltip).toBe('Exyconn Tracker — Paused');
    expect(enabled(tray, 'Pause')).toBe(false);
    expect(item(tray, 'Resume')).toMatchObject({ enabled: true, click: actions.resume });
    expect(enabled(tray, 'Stop')).toBe(true);
  });

  it('names the signed-out and consent states', () => {
    const { tracker, tray } = build();

    tracker.update(stateOf('signed-out', false));
    expect(tray.tooltip).toBe('Exyconn Tracker — Signed out');
    tracker.update(stateOf('consent-required', false));
    expect(tray.tooltip).toBe('Exyconn Tracker — Consent required');
  });

  it('removes the icon on destroy', () => {
    const { tracker, tray } = build();

    tracker.destroy();

    expect(tray.destroyed).toBe(true);
  });
});
