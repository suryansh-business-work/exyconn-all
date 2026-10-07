/**
 * Small builders shared by the component tests in this folder: a workspace's branding, one
 * synced day, and one off-computer claim. Each test overrides only the fields it is about.
 */
import type { Branding, DayDetail, ManualEntry } from '@shared/types';

export function branding(overrides: Partial<Branding> = {}): Branding {
  return {
    businessName: 'Acme Works',
    legalName: '',
    slogan: '',
    logoUrl: '',
    logoDarkUrl: '',
    appIconUrl: '',
    faviconUrl: '',
    primaryColor: '#1d4ed8',
    secondaryColor: '#0f172a',
    accentColor: '#f59e0b',
    backgroundColor: '',
    textColor: '',
    supportEmail: '',
    websiteUrl: '',
    copyrightText: '',
    ...overrides,
  };
}

/** Two ten-minute intervals from 09:00 UTC: 780s active, 420s idle — 65% overall. */
export const DAY_DETAIL: DayDetail = {
  activeMs: 3_600_000,
  idleMs: 600_000,
  keyCount: 1200,
  mouseCount: 800,
  sessions: 2,
  screenshots: [
    {
      id: 'shot-1',
      capturedAt: '2026-09-14T09:05:00.000Z',
      imageUrl: 'data:,',
      blurred: false,
      activityPercent: 72,
    },
  ],
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

export function manualEntry(overrides: Partial<ManualEntry> = {}): ManualEntry {
  return {
    id: 'claim-1',
    projectName: 'Global Project',
    taskKey: '',
    taskTitle: '',
    startedAt: '2026-09-14T09:00:00.000Z',
    endedAt: '2026-09-14T10:30:00.000Z',
    durationMs: 5_400_000,
    note: 'Client visit',
    status: 'PENDING',
    reviewNote: '',
    ...overrides,
  };
}

/** Everything the document currently reads. */
export function pageText(): string {
  return document.body.textContent ?? '';
}
