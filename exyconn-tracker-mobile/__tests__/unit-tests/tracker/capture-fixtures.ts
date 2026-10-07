import type { CaptureReport } from '@exyconn/tracker-core';
import { stats } from '../dashboard/fixtures';

/** A capture report as the engine hands it to the shell. */
export function captureReport(overrides: Partial<CaptureReport> = {}): CaptureReport {
  return {
    capture: { count: 1, capturedAt: '2026-09-11T10:15:00.000Z' },
    stats: stats({ sessionActiveMs: 45 * 60_000, sessionIdleMs: 15 * 60_000, currentApp: 'Slack' }),
    preview: 'base64-preview',
    previewMimeType: 'image/png',
    ...overrides,
  };
}
