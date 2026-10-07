import type { Branding, ManualEntry, TrackerMessage } from '@exyconn/tracker-core';
import type { Capabilities, MobileTrackerState } from '../../../src/tracker/types';
import { settings, stats } from '../dashboard/fixtures';

/**
 * A signed-in, idle phone with every grant given: the state most screens render from. Each
 * test overrides only the facts it is about.
 */
export function trackerState(overrides: Partial<MobileTrackerState> = {}): MobileTrackerState {
  return {
    status: 'idle',
    user: { id: 'user-1', name: 'Asha Rao', email: 'asha@example.test' },
    settings: settings(),
    branding: null,
    permissions: { notifications: true, usageAccess: true, camera: true, allGranted: true },
    stats: stats({ status: 'idle' }),
    preferences: {
      themeMode: 'light',
      muteCaptureSound: false,
      progressStyle: 'bar',
      transparentBackground: false,
      backgroundOpacity: 0.7,
    },
    workProfile: null,
    workday: null,
    projects: [],
    selectedProjectId: '',
    tasks: [],
    tasksLoading: false,
    selectedTaskId: '',
    consentPolicy: null,
    rememberMe: true,
    signedOutReason: null,
    timezone: 'UTC',
    locale: 'en',
    presence: { status: 'WORKING', note: '', since: null },
    unreadMessages: 0,
    ...overrides,
  };
}

/** A workspace that has filled in its brand in the portal. */
export function branding(overrides: Partial<Branding> = {}): Branding {
  return {
    businessName: 'Acme Works',
    legalName: 'Acme Works Ltd',
    slogan: '',
    logoUrl: '',
    logoDarkUrl: '',
    appIconUrl: '',
    faviconUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#0f172a',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    supportEmail: '',
    websiteUrl: '',
    copyrightText: '',
    ...overrides,
  };
}

export const ANDROID_CAPABILITIES: Capabilities = {
  screenshots: true,
  foregroundApp: true,
  inputCounts: false,
  webcam: true,
  background: true,
};

export const IOS_CAPABILITIES: Capabilities = {
  screenshots: false,
  foregroundApp: false,
  inputCounts: false,
  webcam: false,
  background: false,
};

export function manualEntry(overrides: Partial<ManualEntry> = {}): ManualEntry {
  return {
    id: 'entry-1',
    projectName: 'Global Project',
    taskKey: '',
    taskTitle: '',
    startedAt: '2026-10-05T09:00:00.000Z',
    endedAt: '2026-10-05T10:30:00.000Z',
    durationMs: 90 * 60_000,
    note: 'Client visit',
    status: 'PENDING',
    reviewNote: '',
    ...overrides,
  };
}

export function message(overrides: Partial<TrackerMessage> = {}): TrackerMessage {
  return {
    id: 'message-1',
    kind: 'CHAT',
    direction: 'TO_EMPLOYEE',
    title: '',
    body: 'Please sync before you leave.',
    authorName: 'Ravi',
    readAt: null,
    createdAt: '2026-10-05T09:15:00.000Z',
    ...overrides,
  };
}

/**
 * Tamagui's web build writes React Native's `accessibilityLabel` straight onto the DOM node
 * (as the attribute `accessibilitylabel`), while the react-native stub turns it into
 * `aria-label`. This finds an element by either, the way a screen reader would hear it.
 */
export function queryByA11yLabel(label: string, root: ParentNode = document.body) {
  const candidates = root.querySelectorAll<HTMLElement>('[accessibilitylabel], [aria-label]');
  return (
    [...candidates].find(
      (element) =>
        element.getAttribute('accessibilitylabel') === label ||
        element.getAttribute('aria-label') === label,
    ) ?? null
  );
}

export function getByA11yLabel(label: string, root: ParentNode = document.body): HTMLElement {
  const element = queryByA11yLabel(label, root);
  if (element === null) {
    throw new Error(`No element is labelled "${label}".`);
  }
  return element;
}
