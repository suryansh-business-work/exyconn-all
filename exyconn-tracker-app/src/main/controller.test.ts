import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type {
  TrackerProject,
  TrackerSettings,
  TrackerState,
  WorkProfile,
  Workday,
} from '@shared/types';

const tempDir = mkdtempSync(join(tmpdir(), 'controller-'));

vi.mock('electron', () => ({
  app: { getPath: () => tempDir },
  // The controller now announces messages and notices; a test process has no notification
  // centre, and `isSupported: false` is the same answer a locked-down desktop gives.
  Notification: { isSupported: () => false },
  powerMonitor: { getSystemIdleTime: () => 0 },
  systemPreferences: {},
  shell: { openExternal: () => Promise.resolve() },
}));

// macOS TCC status is a real system call; the sync path does not depend on it.
vi.mock('./trackers/permissions', () => ({
  getPermissions: () => ({ screenRecording: true, accessibility: true, allGranted: true }),
  requestPermission: () => Promise.resolve(),
}));
// The native input hook and screen capture cannot run in a test process.
vi.mock('./trackers/input-counter', () => ({
  InputCounter: class {
    start(): void {}
    stop(): void {}
    peek() {
      return { keys: 0, clicks: 0 };
    }
    drain() {
      return { keys: 0, clicks: 0 };
    }
  },
}));
vi.mock('./trackers/window-tracker', () => ({
  WindowTracker: class {
    sample(): Promise<string> {
      return Promise.resolve('Code');
    }
    drain(): unknown[] {
      return [];
    }
  },
}));
vi.mock('./trackers/screenshotter', () => ({
  Screenshotter: class {
    capture(): Promise<unknown[]> {
      return Promise.resolve([]);
    }
  },
}));
vi.mock('./device-info', () => ({ collectDeviceInfo: () => ({ deviceId: 'device-1' }) }));

// A signed-in app, without touching the OS keychain. The project pick is real state, not a
// stub: the controller reads back what it wrote to decide which project a session books to.
const storeState = {
  selectedProjectId: '',
  selectedTaskId: '',
  preferences: { closeToTray: true, themeMode: 'system' },
};

vi.mock('./store', () => ({
  secureStore: () => ({
    getToken: () => 'device-token',
    clearToken: vi.fn(),
    setToken: vi.fn(),
    remembered: true,
    get preferences() {
      return storeState.preferences;
    },
    get selectedProjectId() {
      return storeState.selectedProjectId;
    },
    setSelectedProject: (id: string) => {
      storeState.selectedProjectId = id;
      // Mirrors the real store: the ticket belonged to the old board.
      storeState.selectedTaskId = '';
    },
    get selectedTaskId() {
      return storeState.selectedTaskId;
    },
    setSelectedTask: (id: string) => {
      storeState.selectedTaskId = id;
    },
  }),
}));

vi.mock('./portal-client', async () => {
  const actual = await vi.importActual<typeof import('./portal-client')>('./portal-client');
  return {
    ...actual,
    fetchBranding: vi.fn(() => Promise.reject(new Error('no branding in tests'))),
    trackerMe: vi.fn(),
    heartbeat: vi.fn(),
    markAttendance: vi.fn(),
    startSession: vi.fn(() => Promise.resolve('session-1')),
    // Spread from `actual` this would be the real implementation, and every signed-in test
    // would attempt a network call the controller then swallows.
    fetchTasks: vi.fn(() => Promise.resolve([])),
    setPresence: vi.fn(),
    markMessagesRead: vi.fn(() => Promise.resolve(0)),
  };
});

import { TrackerController } from './controller';
import * as portal from './portal-client';
import { TrackerAuthError } from './portal-client';

const SETTINGS: TrackerSettings = {
  intervalMinutes: 10,
  screenshotsPerInterval: 1,
  randomizeScreenshotTiming: true,
  blurScreenshots: false,
  trackWindowTitles: true,
  idleThresholdSeconds: 300,
  idleAutoPauseMinutes: 0,
  screenshotMaxWidth: 1600,
  screenshotQuality: 60,
  captureSoundEnabled: true,
  webcamEnabled: false,
  webcamCorner: 'bottom-right',
  syncIntervalMinutes: 5,
  autoStartEnabled: false,
  autoStartHour: 9,
  autoStopHour: 18,
  consentText: '<p>Disclosure</p>',
};

const WORK_PROFILE: WorkProfile = {
  workingTime: 'FLEXIBLE',
  workingTimeNote: '',
  workLocation: 'OFFICE',
  workLocationNote: '',
  workHoursPerDay: 8,
  targetMs: 8 * 3_600_000,
};

/** An employee who has already marked themselves in, which is what lets tracking start. */
const WORKDAY: Workday = {
  date: '2026-09-04',
  targetMs: WORK_PROFILE.targetMs,
  activeMs: 0,
  attendanceStatus: 'PRESENT',
  attendanceNote: null,
  attendanceMarked: true,
};

const PROJECTS: TrackerProject[] = [{ id: 'p-global', name: 'Global Project', key: 'GLBL' }];

function portalState(overrides: Partial<portal.TrackerMeResponse> = {}): portal.TrackerMeResponse {
  return {
    user: { id: 'u1', name: 'Emp', email: 'emp@exyconn.com' },
    consentRequired: false,
    settings: SETTINGS,
    timezone: 'Asia/Kolkata',
    workProfile: WORK_PROFILE,
    workday: WORKDAY,
    projects: PROJECTS,
    consentPolicy: null,
    presence: { status: 'WORKING', note: '', since: null },
    notices: [],
    unreadMessages: 0,
    ...overrides,
  };
}

/** A restored, signed-in controller plus the states it pushed to the renderer. */
async function signedInController() {
  const states: TrackerState[] = [];
  const controller = new TrackerController(
    (state) => states.push(state),
    () => undefined,
    () => Promise.resolve(null),
  );
  await controller.restore();
  return { controller, states };
}

describe('portal sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(portal.trackerMe).mockResolvedValue(portalState());
    vi.mocked(portal.heartbeat).mockResolvedValue(portalState());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('adopts settings an admin changed, without a restart', async () => {
    const { controller } = await signedInController();
    expect(controller.getState().settings?.intervalMinutes).toBe(10);

    vi.mocked(portal.heartbeat).mockResolvedValue(
      portalState({ settings: { ...SETTINGS, intervalMinutes: 3, blurScreenshots: true } }),
    );
    await vi.advanceTimersByTimeAsync(60_000);

    const settings = controller.getState().settings;
    expect(settings?.intervalMinutes).toBe(3);
    expect(settings?.blurScreenshots).toBe(true);
  });

  it('checks in with the portal on a timer, so "last seen" stays true', async () => {
    await signedInController();

    await vi.advanceTimersByTimeAsync(180_000);

    expect(vi.mocked(portal.heartbeat)).toHaveBeenCalledTimes(3);
  });

  it('does not re-render the UI when nothing changed', async () => {
    const { states } = await signedInController();
    const before = states.length;

    await vi.advanceTimersByTimeAsync(120_000);

    expect(states.length).toBe(before);
  });

  it('follows the portal into and out of the consent screen', async () => {
    vi.mocked(portal.trackerMe).mockResolvedValue(portalState({ consentRequired: true }));
    const { controller } = await signedInController();
    expect(controller.getState().status).toBe('consent-required');

    vi.mocked(portal.heartbeat).mockResolvedValue(portalState({ consentRequired: false }));
    await vi.advanceTimersByTimeAsync(60_000);

    expect(controller.getState().status).toBe('idle');
  });

  it('signs out, with a reason, once access is revoked', async () => {
    const { controller } = await signedInController();

    vi.mocked(portal.heartbeat).mockRejectedValue(new TrackerAuthError('revoked'));
    await vi.advanceTimersByTimeAsync(60_000);

    const state = controller.getState();
    expect(state.status).toBe('signed-out');
    expect(state.signedOutReason).toMatch(/access was removed/i);
  });

  it('rides out a portal outage without disturbing the session', async () => {
    const { controller } = await signedInController();

    vi.mocked(portal.heartbeat).mockRejectedValueOnce(new TypeError('fetch failed'));
    await vi.advanceTimersByTimeAsync(60_000);

    expect(controller.getState().status).toBe('idle');
    expect(controller.getState().user?.email).toBe('emp@exyconn.com');
  });

  it('stops checking in after sign-out', async () => {
    const { controller } = await signedInController();
    await controller.logout();
    vi.mocked(portal.heartbeat).mockClear();

    await vi.advanceTimersByTimeAsync(180_000);

    expect(vi.mocked(portal.heartbeat)).not.toHaveBeenCalled();
  });
});

describe('the working day', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(portal.trackerMe).mockResolvedValue(portalState());
    vi.mocked(portal.heartbeat).mockResolvedValue(portalState());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('refuses to start until attendance is marked for the day', async () => {
    const unmarked = { ...WORKDAY, attendanceMarked: false, attendanceStatus: null };
    vi.mocked(portal.trackerMe).mockResolvedValue(portalState({ workday: unmarked }));
    const { controller } = await signedInController();

    // The portal enforces this too, but a session that opens and is then rejected has already
    // told the employee they were being tracked when they were not.
    await expect(controller.start()).rejects.toThrow(/Mark your attendance/);
    expect(vi.mocked(portal.startSession)).not.toHaveBeenCalled();
  });

  it('starts once the employee marks in, and books the session to a project', async () => {
    const unmarked = { ...WORKDAY, attendanceMarked: false, attendanceStatus: null };
    vi.mocked(portal.trackerMe).mockResolvedValue(portalState({ workday: unmarked }));
    vi.mocked(portal.markAttendance).mockResolvedValue(WORKDAY);
    const { controller } = await signedInController();

    await controller.markAttendance('PRESENT', null);
    expect(controller.getState().workday?.attendanceMarked).toBe(true);

    await controller.start();
    // No ticket picked, so the session books to the project alone — '' is the real value
    // the portal is sent, not an omission.
    expect(vi.mocked(portal.startSession)).toHaveBeenCalledWith(expect.any(String), 'p-global', '');
  });

  it('books the picked ticket onto the session', async () => {
    vi.mocked(portal.fetchTasks).mockResolvedValue([
      { id: 't-1', key: 'EXY-14', title: 'Fix the thing', assignedToMe: true },
    ]);
    const { controller } = await signedInController();
    await vi.waitFor(() => expect(controller.getState().tasks).toHaveLength(1));

    controller.setTask('t-1');
    await controller.start();

    expect(vi.mocked(portal.startSession)).toHaveBeenCalledWith(
      expect.any(String),
      'p-global',
      't-1',
    );
  });

  it('drops a ticket that is not on the current board rather than sending it', async () => {
    vi.mocked(portal.fetchTasks).mockResolvedValue([]);
    const { controller } = await signedInController();

    controller.setTask('t-from-another-project');

    expect(controller.getState().selectedTaskId).toBe('');
  });

  it('forgets the ticket when the project changes, so it cannot cross boards', async () => {
    vi.mocked(portal.fetchTasks).mockResolvedValue([
      { id: 't-1', key: 'EXY-14', title: 'Fix the thing', assignedToMe: true },
    ]);
    const { controller } = await signedInController();
    await vi.waitFor(() => expect(controller.getState().tasks).toHaveLength(1));
    controller.setTask('t-1');

    controller.setProject('p-global');

    expect(controller.getState().selectedTaskId).toBe('');
  });

  it('books to the house-wide project when the stored pick is no longer offered', async () => {
    const { controller } = await signedInController();

    controller.setProject('p-deleted');

    // Falling back beats failing: unattributed time is a smaller problem than lost time.
    expect(controller.getState().selectedProjectId).toBe('p-global');
  });

  it('carries the day’s target and progress through to the renderer', async () => {
    vi.mocked(portal.trackerMe).mockResolvedValue(
      portalState({ workday: { ...WORKDAY, activeMs: 3_600_000 } }),
    );
    const { controller } = await signedInController();
    const state = controller.getState();

    expect(state.workProfile?.workHoursPerDay).toBe(8);
    expect(state.workday?.targetMs).toBe(8 * 3_600_000);
    expect(state.stats.dayActiveMs).toBe(3_600_000);
  });
});

describe('presence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(portal.trackerMe).mockResolvedValue(portalState());
    vi.mocked(portal.heartbeat).mockResolvedValue(portalState());
    vi.mocked(portal.markAttendance).mockResolvedValue(WORKDAY);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  /** The portal's answer for one presence, which is what the controller keeps. */
  const stated = (status: 'WORKING' | 'LUNCH', note = '') => ({
    status,
    note,
    since: '2026-09-04T06:30:00.000Z',
  });

  it('pauses a running session when the employee says they are at lunch', async () => {
    const { controller } = await signedInController();
    await controller.start();
    expect(controller.getState().status).toBe('tracking');

    vi.mocked(portal.setPresence).mockResolvedValue(stated('LUNCH', 'back at 2'));
    await controller.setPresence('LUNCH', 'back at 2');

    // The whole point: a tracker that kept counting through lunch would bill lunch as work.
    expect(controller.getState().status).toBe('paused');
    expect(controller.getState().presence.status).toBe('LUNCH');
  });

  it('resumes when they come back to Working, so returning is one choice and not two', async () => {
    const { controller } = await signedInController();
    await controller.start();
    vi.mocked(portal.setPresence).mockResolvedValue(stated('LUNCH'));
    await controller.setPresence('LUNCH', '');

    vi.mocked(portal.setPresence).mockResolvedValue(stated('WORKING'));
    await controller.setPresence('WORKING', '');

    expect(controller.getState().status).toBe('tracking');
  });

  it('does not start tracking for somebody who was not tracking to begin with', async () => {
    const { controller } = await signedInController();
    expect(controller.getState().status).toBe('idle');

    vi.mocked(portal.setPresence).mockResolvedValue(stated('WORKING'));
    await controller.setPresence('WORKING', '');

    expect(controller.getState().status).toBe('idle');
  });

  it("keeps the portal's answer, never the status that was asked for", async () => {
    const { controller } = await signedInController();

    // The server trimmed the note. What is on screen must be what was actually recorded.
    vi.mocked(portal.setPresence).mockResolvedValue(stated('LUNCH', 'back at 2'));
    await controller.setPresence('LUNCH', '   back at 2   ');

    expect(controller.getState().presence.note).toBe('back at 2');
  });
});

describe('messages', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(portal.trackerMe).mockResolvedValue(portalState());
    vi.mocked(portal.heartbeat).mockResolvedValue(portalState());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('surfaces the unread count the portal reports, for the drawer badge', async () => {
    const { controller } = await signedInController();
    expect(controller.getState().unreadMessages).toBe(0);

    vi.mocked(portal.heartbeat).mockResolvedValue(portalState({ unreadMessages: 3 }));
    await vi.advanceTimersByTimeAsync(60_000);

    expect(controller.getState().unreadMessages).toBe(3);
  });

  it('marks announcements read once, so the same one is not raised every minute', async () => {
    const notice = {
      id: 'm1',
      kind: 'NOTICE' as const,
      direction: 'TO_EMPLOYEE' as const,
      title: 'Office closed',
      body: 'Friday is a holiday.',
      authorName: 'Ops',
      readAt: null,
      createdAt: '2026-09-04T06:00:00.000Z',
    };
    vi.mocked(portal.trackerMe).mockResolvedValue(portalState({ notices: [notice] }));

    await signedInController();

    expect(vi.mocked(portal.markMessagesRead)).toHaveBeenCalledWith('NOTICE');
  });

  it('clears the badge as soon as the employee opens the thread', async () => {
    vi.mocked(portal.trackerMe).mockResolvedValue(portalState({ unreadMessages: 2 }));
    const { controller } = await signedInController();
    expect(controller.getState().unreadMessages).toBe(2);

    vi.mocked(portal.markMessagesRead).mockResolvedValue(2);
    await controller.markMessagesRead('CHAT');

    // Not waited for on the next heartbeat: they are reading the messages right now.
    expect(controller.getState().unreadMessages).toBe(0);
  });
});
