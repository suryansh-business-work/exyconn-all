/**
 * A stand-in `window.tracker` for tests that render whole screens in jsdom.
 *
 * Every read answers with a small, realistic day of data; every command resolves and does
 * nothing; every `on*` subscription hands back a no-op unsubscribe. Nothing here reaches IPC.
 */
import type {
  DayDetail,
  ReportDay,
  TrackerMessage,
  TrackerSettings,
  TrackerState,
  TrackerStatus,
  UpdateState,
} from '@shared/types';

type TrackerApi = Window['tracker'];

const NOW = '2026-09-14T10:30:00.000Z';

const SCREENSHOTS: DayDetail['screenshots'] = [
  { id: 'shot-1', capturedAt: NOW, imageUrl: 'data:,', blurred: false, activityPercent: 72 },
  { id: 'shot-2', capturedAt: NOW, imageUrl: 'data:,', blurred: true, activityPercent: 18 },
];

const DAY: DayDetail = {
  activeMs: 3_600_000,
  idleMs: 600_000,
  keyCount: 1200,
  mouseCount: 800,
  sessions: 2,
  screenshots: SCREENSHOTS,
  intervals: [
    {
      startedAt: '2026-09-14T09:00:00.000Z',
      endedAt: '2026-09-14T09:10:00.000Z',
      activeMs: 480_000,
      idleMs: 120_000,
      activityPercent: 80,
    },
    {
      startedAt: '2026-09-14T09:10:00.000Z',
      endedAt: '2026-09-14T09:20:00.000Z',
      activeMs: 300_000,
      idleMs: 300_000,
      activityPercent: 50,
    },
  ],
};

const REPORT: ReportDay[] = [
  {
    date: '2026-09-14',
    activeMs: 3_600_000,
    idleMs: 600_000,
    keyCount: 1200,
    mouseCount: 800,
    sessions: 2,
  },
];

const MESSAGES: TrackerMessage[] = [
  {
    id: 'm1',
    kind: 'CHAT',
    direction: 'TO_EMPLOYEE',
    title: '',
    body: 'Welcome aboard.',
    authorName: 'Tracker desk',
    readAt: null,
    createdAt: NOW,
  },
];

const SETTINGS: TrackerSettings = {
  intervalMinutes: 10,
  screenshotsPerInterval: 1,
  randomizeScreenshotTiming: true,
  blurScreenshots: false,
  trackWindowTitles: true,
  idleThresholdSeconds: 120,
  idleAutoPauseMinutes: 10,
  screenshotMaxWidth: 1920,
  screenshotQuality: 80,
  captureSoundEnabled: true,
  webcamEnabled: true,
  webcamCorner: 'bottom-right',
  autoStartEnabled: false,
  autoStartHour: 9,
  autoStopHour: 23,
  syncIntervalMinutes: 5,
  consentText: '<p>This app records your screen while tracking is on.</p>',
};

const UPDATE: UpdateState = {
  stage: 'available',
  version: '9.9.9',
  percent: 0,
  lastCheckedAt: NOW,
};

/** A signed-in employee on an ordinary morning, in whichever status the test needs. */
export function trackerState(status: TrackerStatus): TrackerState {
  return {
    status,
    user: { id: 'u1', name: 'Asha Rao', email: 'asha@example.com' },
    settings: SETTINGS,
    branding: null,
    permissions: { screenRecording: true, accessibility: true, camera: true, allGranted: true },
    stats: {
      status,
      sessionActiveMs: 0,
      sessionIdleMs: 0,
      keyCount: 0,
      mouseCount: 0,
      currentApp: '',
      screenshotCount: 0,
      pendingSync: 0,
      lastSyncAt: NOW,
      syncing: false,
      dayActiveMs: 3_600_000,
      lastSyncOutcome: { kind: 'failed', reason: 'offline' },
    },
    preferences: {
      themeMode: 'light',
      closeToTray: true,
      muteCaptureSound: false,
      progressStyle: 'bar',
      updateAutomatically: false,
      transparentBackground: false,
      backgroundOpacity: 0.8,
    },
    workProfile: {
      workingTime: 'FLEXIBLE',
      workingTimeNote: '',
      workLocation: 'HYBRID',
      workLocationNote: '',
      workHoursPerDay: 8,
      targetMs: 28_800_000,
    },
    workday: {
      date: '2026-09-14',
      targetMs: 28_800_000,
      activeMs: 3_600_000,
      attendanceStatus: null,
      attendanceNote: null,
      attendanceMarked: false,
    },
    projects: [{ id: 'p1', name: 'Global Project', key: 'GLOBAL' }],
    selectedProjectId: 'p1',
    tasks: [{ id: 't1', key: 'EXY-1', title: 'Onboarding', assignedToMe: true }],
    selectedTaskId: '',
    consentPolicy: null,
    rememberMe: false,
    signedOutReason: null,
    timezone: 'UTC',
    locale: 'en',
    presence: { status: 'WORKING', note: '', since: null },
    unreadMessages: 1,
  };
}

/** What each read answers; anything not listed resolves to undefined. */
function answers(state: TrackerState): Partial<Record<keyof TrackerApi, unknown>> {
  return {
    getState: state,
    getReport: REPORT,
    getDay: DAY,
    getTotals: { activeMs: 7_200_000, idleMs: 900_000, screenshots: 12, sessions: 4 },
    getTranslations: {},
    translateMissing: {},
    getMessages: MESSAGES,
    getManualEntries: [],
    getTasks: [],
    getUpdate: UPDATE,
    getAppVersion: '1.0.0',
  };
}

/** Installs the fake bridge on `window.tracker` for the given state. */
export function installTracker(state: TrackerState): void {
  const table = answers(state);
  const api = new Proxy(
    {},
    {
      get(_target, name: string) {
        if (name === 'transparencySupported') {
          return false;
        }
        if (name.startsWith('on')) {
          return () => () => undefined;
        }
        return () => Promise.resolve(table[name as keyof TrackerApi]);
      },
    },
  );
  Object.defineProperty(globalThis, 'tracker', { value: api, configurable: true, writable: true });
}
